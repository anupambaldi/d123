const {
    models: { User, Practice, Concierge, Country, Vendor,Zip,ProductVendor,Week,Sale }
} = require('../../../../lib/models');
const mailer = require('../../../../lib/mailer');

const sms = require('../../../../lib/sms');
const { signToken } = require('../../util/auth');
const { signTempToken } = require('../../util/auth');
const { getPlatform } = require('../../util/common');
const { utcDateTime,getWeekNumber, generateOtp, logError,adminEmail, randomString, createS3SingnedUrl, generateResetToken, sendSms } = require('../../../../lib/util');
var _ = require('lodash');
const jwtToken = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//const { compress } = require('compress-images/promise');

//const mailer = require('../../../../lib/mailer');

let apiEnv = process.env.NODE_ENV;
console.log("this is env:",apiEnv);
var moment = require('moment');
const multer = require('multer');
//var sgTransport = require('nodemailer-sendgrid-transport');
//var SGoptions = {
//  auth: {
//    api_key: SendGridKey
//  }
//};

class AuthController {
    async logIn(req, res,next) {
            try{
            const {email, password, deviceToken, deviceId, deviceType} = req.body;
            let phonepattern = /^\d{10}$/;
            let intRegex = /^\d+$/;
            let floatRegex = /^((\d+(\.\d *)?)|((\d*\.)?\d+))$/;
            let user;
            let login = true;
            let verificationSent = false;
            let otpSent = false;
            let sentOtp = '';
            let profileAdded = false;
            const platform = req.headers['x-dindin-platform'];
            const version = req.headers['x-dindin-version'];
            let msg;

            user = await User.findOne({ email: email, isDeleted: false});
            
            if (!user) {
                return res.notFound('', 'Invalid email or password');
            }

            let timestamp1 = Date.now();
            console.log(timestamp1);
            let timestamp2 = user.like_time;
            // let time = 1636693749000;

            var hours = Math.abs(timestamp1 - timestamp2) / 36e5;
            //console.log(hours);

            let showPop = false;
            if (hours > 24) {
                showPop = true
            } else {
                showPop = false
            }

            msg = "Invalid email or password";

            const passwordMatched = await user.comparePassword(password);
            
            if (!passwordMatched) {
                return res.warn('', msg);
            }

            //deviceId  ---> Single Value
            let deviceArr = user.deviceId;
            let newDevice = "no";
            
            let otp;

            if(apiEnv == 'development'){
                otp = generateOtp();
            }else{
                 otp = generateOtp();
            }


            user.otp = otp;
            user.emailToken = generateResetToken(12);

            if(deviceArr.indexOf(deviceId) !== -1){
                newDevice = "no";
            } else{
                newDevice = "yes";
            }
            
            
            
            user.authTokenIssuedAt = utcDateTime().valueOf();
            user.deviceToken = deviceToken;
            user.deviceType = deviceType;
            await user.save();
            
            let token = user.emailToken;

            let is_skip = user.skipTwoStep;
            let isSkip;
            if ((is_skip == true) && (newDevice == "yes")) {
                isSkip = "no"
            } else {
                isSkip = "yes"
            }

            const jwttoken = signToken(user);

            if (newDevice == "yes") {

                let emailToSend = user.email;
                   
                //Construct mail body here
                const msg = {
                        to: emailToSend,
                        from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                        subject: 'Din Din: Verify Your Device',
                        text: 'Please enter the following OTP to verify your device : '+user.otp,
                        html: '<strong>Please enter the following OTP to verify your device :'+user.otp+' </strong>',
                    }

                //Send Email Here
                sgMail
                    .send(msg)
                        .then(() => {
                            console.log('Email sent');

                            if (user.isSuspended) {
                                return res.warn({ "userId": user._id, "emailVerified": user.emailVerify, "adminVerified": !(user.isSuspended)}, 'Admin has yet to approve verification');
                            }

                            const userJson = user.toJSON();

                            ['password', 'authTokenIssuedAt','otp','emailToken', '__v'].forEach(key => delete userJson[key]);

                            return res.success({
                                "language": req.headers['accept-language'],
                                token,
                                jwt:jwttoken,
                                user: userJson,
                                newDevice: newDevice,
                                is_skip: isSkip,
                                showPop: showPop
                            }, req.__('LOGIN_SUCCESS'));

                        })
                        .catch((error) => {
                            console.error(error)
                        })


            }else {
                
                if (user.isSuspended) {
                    return res.warn({ "userId": user._id, "emailVerified": user.emailVerify, "adminVerified": !(user.isSuspended)}, 'Admin has yet to approve verification');
                }

                const userJson = user.toJSON();
                
                ['password', 'authTokenIssuedAt','otp','emailToken', '__v'].forEach(key => delete userJson[key]);
                

                return res.success({
                    "language": req.headers['accept-language'],
                    token,
                    jwt:jwttoken,
                    user: userJson,
                    newDevice: newDevice,
                    is_skip: isSkip,
                    showPop: showPop
                }, req.__('LOGIN_SUCCESS'));


            }

        } catch(err){
            return next(err);
        }
    }


    async socialLogIn(req, res, next) {
        try {

            const { email, social_type, social_id, deviceType, deviceId, deviceToken, email_manual, firstname, lastname, mobile, image} = req.body;               
            let user;
            let profileAdded = false;
            const platform = req.headers['x-dindin-platform'];
            const version = req.headers['x-dindin-version'];
            let msg;
            
            //Check 1 -- find user with social ID in DB
            user = await User.findOne({ social_id: social_id, isDeleted: false });
            //console.log("=====1=====");
            let timestamp1 = Date.now();
            let showPop = false;
            
            if((user != null) && (user.like_time)) {
                let timestamp2 = user.like_time;
                var hours = Math.abs(timestamp1 - timestamp2) / 36e5;
                
                //console.log(hours);
                if (hours > 24) {
                    showPop = true
                } else {
                    showPop = false
                }
            }else {
                showPop = true
            }

            // let time = 1636693749000;
            //console.log(timestamp2);

            if (!user) {
                 //Check 2 --> Check Email exist ?
                //email find if exist or not
                let checkEmailExists = await User.findOne({
                    email
                });
                
                //console.log("=====2=====");
                if (checkEmailExists && checkEmailExists.email) {
                    return res.warn({
                        contactExist: true,
                        email: checkEmailExists.mobile,
                    }, req.__('EMAIL_EXISTS'));
                }else {
                    
                    //console.log("=====3=====");
                    //Sign up process goes here
                    let x = await User.findOne({ email });
                    if (!x) {
                        let user = new User();
                        let otp;
                        otp = generateOtp();
                        const platform = req.headers['x-dindin-platform'];
                        const version = req.headers['x-dindin-version'];
                        user.email = email;
                        user.password = email+'123';
                        user.role = 'normal';
                        user.otp = otp;
                        user.authTokenIssuedAt = utcDateTime().valueOf();
                        user.emailToken = generateResetToken(12);
                        user.emailVerify = false;
                        
                        user.social_id = social_id;
                        user.social_type = social_type;
                        //user.avatar = image;
                        user.firstname = firstname;
                        user.lastname = lastname;
        
                        if (deviceToken){
                            user.deviceToken = deviceToken;
                            user.deviceType = deviceType;
                        }    
                        

                        let deviceArr = user.deviceId;
                        let newDevice = "no";

                        if (deviceArr.indexOf(deviceId) !== -1) {
                            //console.log("Exists");
                            newDevice = "no";
                        } else {
                            newDevice = "yes";
                        }

                        user = await user.save();


                        let token = user.emailToken;

            let is_skip = user.skipTwoStep;
            let isSkip
            if ((is_skip == true) && (newDevice == "yes")) {
                isSkip = "no"
            } else {
                isSkip = "yes"
            }

            const jwttoken = signToken(user);

            if (newDevice == "yes") {

                let emailToSend = user.email;

                //Construct mail body here
                const msg = {
                    to: emailToSend,
                    from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                    subject: 'Din Din: Verify Your Device',
                    text: 'Please enter the following OTP to verify your device : ' + user.otp,
                    html: '<strong>Please enter the following OTP to verify your device :' + user.otp + ' </strong>',
                }

                //Send Email Here
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent');

                        if (user.isSuspended) {
                            return res.warn({ "userId": user._id, "emailVerified": user.emailVerify, "adminVerified": !(user.isSuspended) }, 'Admin has yet to approve verification');
                        }

                        const userJson = user.toJSON();

                        ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(key => delete userJson[key]);

                        return res.success({
                            "language": req.headers['accept-language'],
                            token,
                            jwt: jwttoken,
                            user: userJson,
                            newDevice: newDevice,
                            is_skip: isSkip,
                            showPop: showPop

                        }, req.__('LOGIN_SUCCESS'));

                    })
                    .catch((error) => {
                        console.error(error)
                    })


                
    

                    } else {

                        if (user.isSuspended) {
                            return res.warn({ "userId": user._id, "emailVerified": user.emailVerify, "adminVerified": !(user.isSuspended) }, 'Admin has yet to approve verification');
                        }

                        const userJson = user.toJSON();

                        ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(key => delete userJson[key]);
                        let is_skip = userJson.skipTwoStep;
                        let isSkip;
                        if ((is_skip == true) && (newDevice == "yes")) {
                            isSkip = "no"
                        } else {
                            isSkip = "yes"
                        }

                        return res.success({
                            "language": req.headers['accept-language'],
                            token,
                            jwt: jwttoken,
                            user: userJson,
                            is_skip: isSkip,
                            showPop:showPop
                        }, req.__('LOGIN_SUCCESS'));

                    }

                        
                    } else {
                            return res.warn('', req.__('EMAIL_EXISTS'));
                    }

                }

            }else {
            //Login the user here

            //deviceId  ---> Single Value
            let deviceArr = user.deviceId;
            let newDevice = "no";
            let otp;
            otp = generateOtp();

            user.otp = otp;
            user.emailToken = generateResetToken(12);

            if (deviceArr.indexOf(deviceId) !== -1) {
                //console.log("Exists");
                newDevice = "no";
            } else {
                newDevice = "yes";
            }


            user.authTokenIssuedAt = utcDateTime().valueOf();
            user.deviceToken = deviceToken;
            user.deviceType = deviceType;

            await user.save();

            let token = user.emailToken;

            let is_skip = user.skipTwoStep;
            let isSkip
            if ((is_skip == true) && (newDevice == "yes")) {
                isSkip = "no"
            } else {
                isSkip = "yes"
            }

            const jwttoken = signToken(user);

            if (newDevice == "yes") {

                let emailToSend = user.email;

                //Construct mail body here
                const msg = {
                    to: emailToSend,
                    from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                    subject: 'Din Din: Verify Your Device',
                    text: 'Please enter the following OTP to verify your device : ' + user.otp,
                    html: '<strong>Please enter the following OTP to verify your device :' + user.otp + ' </strong>',
                }

                //Send Email Here
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent');

                        if (user.isSuspended) {
                            return res.warn({ "userId": user._id, "emailVerified": user.emailVerify, "adminVerified": !(user.isSuspended) }, 'Admin has yet to approve verification');
                        }

                        const userJson = user.toJSON();

                        ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(key => delete userJson[key]);

                        return res.success({
                            "language": req.headers['accept-language'],
                            token,
                            jwt: jwttoken,
                            user: userJson,
                            newDevice: newDevice,
                            is_skip: isSkip,
                            showPop:showPop
                        }, req.__('LOGIN_SUCCESS'));

                    })
                    .catch((error) => {
                        console.error(error)
                    })


                
    

            } else {

                if (user.isSuspended) {
                    return res.warn({ "userId": user._id, "emailVerified": user.emailVerify, "adminVerified": !(user.isSuspended) }, 'Admin has yet to approve verification');
                }

                const userJson = user.toJSON();

                ['password', 'authTokenIssuedAt', 'otp', 'emailToken', '__v'].forEach(key => delete userJson[key]);
                let is_skip = userJson.skipTwoStep;
                let isSkip;
                if ((is_skip == true) && (newDevice == "yes")) {
                    isSkip = "no"
                } else {
                    isSkip = "yes"
                }

                return res.success({
                    "language": req.headers['accept-language'],
                    token,
                    jwt: jwttoken,
                    user: userJson,
                    is_skip: isSkip,
                    showPop:showPop
                }, req.__('LOGIN_SUCCESS'));

            }
                
            }              

        } catch (err) {
            return next(err);
        }
    }

    async generateToken(req, res) {
        let _id = req.params._id;
        const user = await User.findOne({ _id });
        const platform = req.headers['x-hrms-platform'];
        const token = signToken(user, platform);
        return res.success({
            token
        });
    }

    async logOut(req, res) {
        const { user } = req;
        user.authTokenIssuedAt = null;
        user.deviceToken = null;
        await user.save();
        return res.success('', req.__('LOGOUT_SUCCESS'));
    }


    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async verifyOtp(req, res, next) {
        let {
            otp,email,token,remember,deviceId
        } = req.body;
        try {
            
            let user; 
            user = await User.findOne({
                email, isDeleted: false
            })

            if (!user) {
                return res.unauthorized(null, req.__('UNAUTHORIZED'));
            }

            let timestamp1 = Date.now();
            console.log(timestamp1);
            let timestamp2 = user.like_time;
            // let time = 1636693749000;

            var hours = Math.abs(timestamp1 - timestamp2) / 36e5;
            //console.log(hours);

            let showPop = false;
            if (hours > 24) {
                showPop = true
            } else {
                showPop = false
            }

            if (user) {
                if (user.otp == otp) {

                    if(user.emailToken == token) {
                       user.emailVerify = 'true';
                       if(remember > 0) {
                           user.deviceId.push(deviceId);
                       }
                    }

                    let newUser = await user.save();
                    const userJson = newUser.toJSON();
                    //console.log(newUser);
                    const jwttoken = signToken(user);

                    return res.success(
                        {
                            _id: newUser._id,
                            jwt:jwttoken,
                            user: userJson,
                            emailVerified: newUser.emailVerify,
                            showPop:showPop,
                            token: token
                        },
                        req.__('OTP_VERIFY_SUCCESS')
                    );
                } else {
                    return res.warn('', req.__('INVALID_OTP'));
                }
            } else {
                return res.warn('', req.__('GENERAL_ERROR'));
            }

        } catch (err) {
            return next(err)
        }
    }

    async skipVerify(req, res, next) {
        let {
            email
        } = req.body;
        try {

            let user;
            user = await User.findOne({
                email, isDeleted: false
            })
            
            if (!user) {
                return res.unauthorized(null, req.__('UNAUTHORIZED'));
            }

            let timestamp1 = Date.now();
            console.log(timestamp1);
            let timestamp2 = user.like_time;
            // let time = 1636693749000;

            var hours = Math.abs(timestamp1 - timestamp2) / 36e5;
            //console.log(hours);

            let showPop = false;
            if (hours > 24) {
                showPop = true
            } else {
                showPop = false
            }

            if (user) {
                user.emailVerify = 'true';
                user.skipTwoStep  = 'false';
                let newUser = await user.save();

                const userJson = newUser.toJSON();
                //console.log(newUser);
                const jwttoken = signToken(user);

                return res.success(
                    {
                        _id: newUser._id,
                        jwt: jwttoken,
                        user: userJson,
                        showPop:showPop,
                        emailVerified: newUser.emailVerify,
                    },
                    "2 step skipped and logged in successfully"
                );
                   
            } else {
                return res.warn('', req.__('GENERAL_ERROR'));
            }

        } catch (err) {
            return next(err)
        }
    }

    async resendOtp(req, res, next) {
        let {
            email,token
        } = req.body;
        try {
            let user; 
            user = await User.findOne({
                email, isDeleted: false
            })

            if (!user) {
                return res.unauthorized(null, req.__('UNAUTHORIZED'));
            }
            if (user) {
                let otp = generateOtp();
                user.otp = otp;
                user.mobileVerify = false;
                let newUser = await user.save()

                //console.log(newUser);
                let forgotToken = newUser.resetToken;
                let emailToken = newUser.emailToken;

                if(token == forgotToken) {

                    if(newUser.email != ''){
                        let emailToSend = newUser.email;
                        //Construct mail body here
                        const msg = {
                            to: emailToSend,
                            from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                            subject: 'Din Din: Forgot Password OTP',
                            text: 'Please enter the following OTP to reset your password : '+user.otp,
                            html: '<strong>Please enter the following OTP to reset your password :'+user.otp+' </strong>',
                        }
    
                        //console.log(msg);
    
                        //Send Email Here
                        sgMail
                            .send(msg)
                                .then(() => {
                                    console.log('Email sent');
    
                                    return res.success(
                                        {
                                            message: 'OTP sent successfully !!'
                                        }, req.__('OTP_SEND_SUCCESS')
                                    );
                                })
                                .catch((error) => {
                                    console.error(error)
                                })
                    }

                }else {

                    if(newUser.email != ''){
                        let emailToSend = newUser.email;
                        //Construct mail body here
                        const msg = {
                            to: emailToSend,
                            from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                            subject: 'Din Din: Verify Email OTP',
                            text: 'Please enter the following OTP to verify your email : '+user.otp,
                            html: '<strong>Please enter the following OTP to verify your email :'+user.otp+' </strong>',
                        }
    
                        //console.log(msg);
    
                        //Send Email Here
                        sgMail
                            .send(msg)
                                .then(() => {
                                    console.log('Email sent');
    
                                    return res.success(
                                        {
                                            message: 'OTP sent successfully !!'
                                        }, req.__('OTP_SEND_SUCCESS')
                                    );
                                })
                                .catch((error) => {
                                    console.error(error)
                                })
                    }
                }

                return res.success(
                    {
                        "language": req.headers['accept-language'],
                    },
                    req.__('OTP_SEND_SUCCESS')
                );

            } else {
                return res.warn('', req.__('GENERAL_ERROR'));
            }

        } catch (err) {
            return next(err)
        }
    }

    /**
     * 
     * @param {email,password,deviceToken,deviceType} req 
     * @param {*} res 
     * @param {*} next 
     */
    async signup(req, res, next) {
        let {
            email, password, deviceToken, deviceType
        } = req.body;

        try {
            //email find if exist or not
            let checkEmailExists = await User.findOne({
                email
            });
            

            if(checkEmailExists && checkEmailExists.emailVerify == false) {
                
                console.log("========================");
                //Remove the record from the DB here first
                let resDel = await User.deleteOne({ _id: checkEmailExists._id });
                console.log(resDel);

                //Add new record here and send response
                let user = new User();
                let otp;

                if(apiEnv == 'development'){
                    otp = generateOtp();
                }else{
                    otp = generateOtp();
                }
                const platform = req.headers['x-dindin-platform'];
                const version = req.headers['x-dindin-version'];
                user.email = email;
                user.password = password;
                user.role = 'normal';
                user.otp = otp;
                user.authTokenIssuedAt = utcDateTime().valueOf();
                user.emailToken = generateResetToken(12);
                user.emailVerify = false;

                if (deviceToken){
                    user.deviceToken = deviceToken;
                    user.deviceType = deviceType;
                }    

                user = await user.save();

                //console.log("=====================");
                //console.log(user);

                let emailToSend = user.email;
                let token = user.emailToken;
                    
                //console.log('--------------test------------');
                //Construct mail body here
                const msg = {
                    to: emailToSend,
                    from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                    subject: 'Din Din: Verify Your Login',
                    text: 'Please enter the following OTP to verify your login : '+user.otp,
                    html: '<strong>Please enter the following OTP to verify your login :'+user.otp+' </strong>',
                    }

                    const userJson = user.toJSON();
                    ['password', 'authTokenIssuedAt','otp','emailToken', '__v'].forEach(key => delete userJson[key]);
                    userJson.isDefaultLocation = false;
                    return res.success({
                        token,
                        user: userJson,
                    }, "Registration Completed"
                   );
                
                    //if(apiEnv == 'production') {
                if(apiEnv) {

                    //Send Email Here
                // sgMail
                // .send(msg)
                //     .then(() => {
                //         console.log(user);

                        

                //     })
                //     .catch((error) => {
                //         console.error(error)
                //     })    

                }else {
                    const userJson = user.toJSON();
                    ['password', 'authTokenIssuedAt','otp','emailToken', '__v'].forEach(key => delete userJson[key]);
                    userJson.isDefaultLocation = false;
                    return res.success({
                        "language": req.headers['accept-language'],
                        token,
                        user: userJson,
                    }, "Registration Completed"
                    );
                }

            }else {
                if (checkEmailExists && checkEmailExists.email) {
                    return res.warn({
                        contactExist: true,
                        email: checkEmailExists.mobile,
                    }, req.__('EMAIL_EXISTS'));
                }
            }

            let x = await User.findOne({ email });
            if (!x) {
                let user = new User();
                let otp;

                if(apiEnv == 'development'){
                    otp = generateOtp();
                }else{
                    otp = generateOtp();
                }
                const platform = req.headers['x-dindin-platform'];
                const version = req.headers['x-dindin-version'];
                user.email = email;
                user.password = password;
                user.role = 'normal';
                user.otp = otp;
                user.authTokenIssuedAt = utcDateTime().valueOf();
                user.emailToken = generateResetToken(12);
                user.emailVerify = false;

                if (deviceToken){
                    user.deviceToken = deviceToken;
                    user.deviceType = deviceType;
                }    

                user = await user.save();

                let emailToSend = user.email;
                let token = user.emailToken;
                    
                //console.log('--------------test------------');
                //Construct mail body here
                const msg = {
                    to: emailToSend,
                    from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                    subject: 'Din Din: Verify Your Login',
                    text: 'Please enter the following OTP to verify your login : '+user.otp,
                    html: '<strong>Please enter the following OTP to verify your login :'+user.otp+' </strong>',
                    }

                //if(apiEnv == 'production') {
                if(apiEnv) {

                    //Send Email Here
                sgMail
                .send(msg)
                    .then(() => {
                        console.log('Email sent');
                        
                        const userJson = user.toJSON();
                        ['password', 'authTokenIssuedAt','otp','emailToken', '__v'].forEach(key => delete userJson[key]);
                        userJson.isDefaultLocation = false;
                        return res.success({
                            "language": req.headers['accept-language'],
                            token,
                            user: userJson,
                        }, "Registration Completed"
                       );

                    })
                    .catch((error) => {
                        console.error(error)
                    })    

                }else {
                    const userJson = user.toJSON();
                    ['password', 'authTokenIssuedAt','otp','emailToken', '__v'].forEach(key => delete userJson[key]);
                    userJson.isDefaultLocation = false;
                    return res.success({
                        "language": req.headers['accept-language'],
                        token,
                        user: userJson,
                    }, "Registration Completed"
                    );
                }
                
            } else {
                    return res.warn('', req.__('EMAIL_EXISTS'));
            }
    } catch (err) {
        console.log(err);
        return next(err)
        }
    }

   

    async state_list(req, res, next) {
        //admin.emailToken = generateResetToken();
        try {
            Country.aggregate([
                {
                    $match: { _id: ObjectId('5e134bcc80286b22e44920a0') }  // United States  ID
                },
                {
                    $lookup: {

                        "from": "states",
                        "foreignField": "country_id",
                        "localField": "_id",
                        "as": "statelist"
                    }
                }
            ]).exec((err, result) => {
                if (err) {
                    console.log("error", err)
                }
                if (result) {
                    let statelist = result[0].statelist;
                    return res.success({
                        "language": req.headers['accept-language'],
                        state: statelist
                    });

                }
            });

        } catch (err) {
            console.log(err);
            return next(err)
        }
    }

    async forgotPassword(req, res, next) {
        let {
            email
        } = req.body
        try {
            let user; 
            
           // console.log("this is Email Address>>>>>>>",email);
            user = await User.findOne({
                email, isDeleted: false
                })
            
          //  console.log("this is user>>>>>>>>>>>>>>",user);
            if(!user){
                return res.warn('', req.__('EMAIL_NOT_REGISTER'));
            }

            if (user) {
                if (user.isSuspended) {
                    //account suspended
                    return res.warn('', 'Your account is not verified by admin');
                } 
                //generated unique token and save in user table and send reset link
                let resetToken = randomString(10);
                // let resetToken = generateResetToken(12)
                let otp = generateOtp();
                user.resetToken = resetToken;
                //user.emailVerify = false;
                // user.mobileVerify = false;
                user.otp = otp;
                user.authTokenIssuedAt = utcDateTime().valueOf();
                await user.save();

               // console.log(user);

                if(user.email != ''){
                    let emailToSend = user.email;
                    
                    //console.log('--------------test------------');
                    //Construct mail body here
                    const msg = {
                        to: emailToSend,
                        from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                        subject: 'Din Din: Forgot Password OTP',
                        text: 'Please enter the following OTP to reset your password : '+user.otp,
                        html: '<strong>Please enter the following OTP to reset your password :'+user.otp+' </strong>',
                      }

                    //Send Email Here
                    sgMail
                        .send(msg)
                            .then(() => {
                                console.log('Email sent');

                                return res.success(
                                    {
                                        token:resetToken
                                    }, req.__('OTP_SEND_SUCCESS')
                                );
                            })
                            .catch((error) => {
                                console.error(error)
                            })
                    
                }
                
             } else {
                //no user found
                return res.warn('', req.__('EMAIL_NOT_REGISTER'));
            }

        } catch (err) {
            return next(err)
        }
    }

    async resetPassword(req, res, next) {
        let {
            password, email
        } = req.body;
        try {
            const user = await User.findOne({
                email, isDeleted: false
            });

            if (!user) {
                return res.unauthorized(null, req.__('UNAUTHORIZED'));
            }
            if (user) {
                user.password = password;
                let email = user.email;
                let newUser = await user.save();

                let emailToSend = newUser.email;
                //Construct mail body here
                const msg = {
                    to: emailToSend,
                    from: 'ronie.ochoajr@gmail.com', // Change to your verified sender
                    subject: 'Din Din: Password Updated',
                    text: 'Password has been Updated',
                    html: '<strong>Password has been Updated</strong>',
                }

                //Send Email Here
                sgMail
                    .send(msg)
                        .then(() => {
                            console.log('Email sent');

                            return res.success(
                                {
                                    message: 'OTP sent successfully !!'
                                }, req.__('OTP_SEND_SUCCESS')
                            );
                        })
                        .catch((error) => {
                            console.error(error)
                        })


                return res.success('', req.__("PASSWORD_CHANGED"));
            } else {
                return res.warn('', req.__('GENERAL_ERROR'));
            }

        } catch (err) {
            return next(err)
        }

    }

    async checkValidation(req, res, next) {
        let {
            mobile,email
        } = req.body
        //admin.emailToken = generateResetToken();
        try {
            let user = await Concierge.findOne({mobile:mobile});
            if(user){
                return res.warn('',req.__('MOBILE_NO_EXISTS'))
            } else {
                user = await Concierge.findOne({email});
                if(user){
                    return res.warn('', req.__('EMAIL_EXISTS'))
                } else {
                    return res.success('','Success'); 
                }
               
            }
        } catch (err) {
            console.log(err);
            return next(err)
        }
    }

    async testA(req, res, next) {
        sms.sendSms("tter", "sdfdfd", "otp").then((data) => {
            console.log("data", data);
        }).catch(error => {
            return res.warn(' ', req.__('SMS_NOT_SENT'));
        });
    }


    async rejectPosition(req, res, next) {
        let {
            id
        } = req.body
        //admin.emailToken = generateResetToken();
        try {
            let sale = await Sale.findOne({_id:id});
            let emailToSend = sale.email;
            if(sale){
                await Sale.deleteOne({_id:id});
                mailer
                        .sendMail(
                        'reject-position',
                        'HRMS Compliance requirements',
                        emailToSend,
                        {
                            username: sale.firstName+' '+sale.lasttName,
                          
                        }
                        ).then(() => {
                            //return res.success(' ', req.__('INVITATION_EMAIL_SENT')); 
                        })
                        .catch(error => {
                            logError(`Failed to send mail ${email}`);
                            logError(error);
                            //return res.warn(' ', req.__('EMAIL_NOT_SENT'));
                        });
                        return res.warn('', 'Email sent')
            } else {
                return res.warn('', 'Sale data not available')
           }
        } catch (err) {
            console.log(err);
            return next(err)
        }
    }


}

module.exports = new AuthController();

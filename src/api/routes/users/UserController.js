const {
    models: { User,Product,Order,Categories,Practice,State,Vendor,Lead,LikeDislike,Food }
} = require('../../../../lib/models');
const moment = require('moment');
const fs = require('fs');
const multer = require('multer');

const { utcDateTime, generateOtp, logError, randomString,getS3SingnedUrl, createS3SingnedUrl, generateResetToken, sendSms,utcDate,uploadImageBase64,uploadImageAPI } = require('../../../../lib/util');


var _ = require('lodash');

var  allAddress = [
    {
        "key": "home",
        "nameEN": "Home",
        "nameCHN": "Home"
    },
    {
        "key": "work",
        "nameEN": "Work",
        "nameCHN": "Work"
    }
]

class UserController {

    async dashboard(req, res, next) {
        //console.log("request",req);
        let role  = req.role;
        let id = req._id;
        let Products = {};
        let Orders = {};
        //var order = new Order({ userId: id, orderItemCount: 10, orderDate: utcDateTime().valueOf()});
        //await order.save();
        console.log("role",role);
        if(role=="practice"){
          Orders =  await Order.find({ userId:id }).sort({orderDate: 'desc'}).limit(10);
          Orders = _.groupBy(Orders, function(item) {
                     let c = Number(item.orderDate);
                     let orderD = moment(c).format("MM/DD/YYYY");
                     return orderD;
                });
                var p = [];
                var allKeys = _.keys( Orders );
                _.each( allKeys,(x)=>{
                    p.push( { "orderDate":x,"orders":Orders[x]  } )
                })

          let categories =  await Categories.find({ isDeleted:false }).lean();
         Categories.aggregate([
            {
                $match: {isDeleted:false,isSuspended:false,parentId: null}  // United States  ID
            },
            {
                $lookup:{

                    "from":"categories",
                    "foreignField":"parentId",
                    "localField":"_id",
                    "as":"subCat"
                }
            }
        ]).exec((err, result)=>{
            if (err) {
               res.warn('', req.__('ERROR_DATA'))
            }
            if (result) {
               
                res.success({allProducts:result,orders:p}, req.__('GET_DATA'))
               
            }
        });
        
       
        } else {
           res.warn('', req.__('Please login with practice role')) 
        }
       
      
    }


    async updatePassword(req, res) {
        const { user } = req;
        const { currentPassword, newPassword } = req.body;

        const matched = await user.comparePassword(currentPassword);
        if (!matched) {
            return res.warn('', req.__('PASSWORD_MATCH_FAILURE'));
        }
        const matcheAddedPassword = await user.comparePassword(newPassword);
        if(matcheAddedPassword){
            return res.warn('','Old password and new passowrd can not be same');
        }


        user.password = newPassword;
        await user.save();

        return res.success('', 'Password updated successfully.');
    }

    async profileAccountInfo(req, res) {
        let {
            email
       } = req.body;

       let user = await User.findOne( { _id:req.user._id } );

       let userInformation = {};
   
       if (!user) {
           return res.notFound('', req.__('INVALID_REQUEST'));
       }
       else{
           userInformation["firstname"] = user.firstname;
           userInformation["lastname"] = user.lastname;
           userInformation["email"] = user.email;
           userInformation["radius"] = user.radius;
           userInformation["predetermine"] = user.predetermine;
           userInformation["profilephoto"] = user.avatar;
           userInformation["social_type"] = user.social_type;
           userInformation["social_id"] = user.social_id;
           
       }
      
       return res.success(JSON.parse(JSON.stringify(userInformation)),req.__('Profile_Information'));
    }

    async notification(req, res, next) {

        const { user } = req;      
        let userid = user._id;
        //const _id=req.body.userId;
        const notify=req.body.notification_setting;
        // const notify = {};

        //console.log(userid);
        User.findOneAndUpdate({_id:userid}, req.body, function (err, place) {
           // res.send(place);
                return res.success({
                    status:true,
                    msg:"notification_setting updated successfully",
                    data:place,
                });
         });
        
    }

    async pageAboutus(req, res, next) {
        const aboutpage=req.body.slug;
        // const notify = {};
        //console.log(aboutpage);
        const p = await Page.findOne({slug: aboutpage})
        return res.success({
            status:true,
            msg:"Details has been fetched successfully",
            data:p,
        });
        
    }
 
    async searchVendor(req, res, next){
    var name = 'Peter';
    model.findOne({name: new RegExp('^'+name+'$', "i")}, function(err, doc) {
  //Do your action here..
    });
    }
     async add_leads(req, res, next) {
        let {
             businessName, name, email, mobile, phone, ip
        } = req.body;
        console.log(req.body)
        //admin.emailToken = generateResetToken();
        try {

            let checkPhoneExists = await Lead.findOne({
                phone, isActive: true
            });

            if (checkPhoneExists && checkPhoneExists.phone) {
                return res.warn({
                    contactExist: true,
                    phone: checkPhoneExists.phone,
                }, req.__('MOBILE_NO_EXISTS'));
            } else {
                let x = await Lead.findOne({ email, isActive: true })
                if (!x) {
                    var lead = new Lead();
                    const platform = req.headers['x-hrms-platform'];
                    lead.email = email;
                    lead.owner_name = name;
                    lead.business_name = businessName
                    lead.direct_phone_no = phone;
                    lead.mobile = mobile;
                    lead.ip_address = ip;
                    lead = await lead.save();
                    const leadJson = lead.toJSON();
                    return res.success({
                        "language": req.headers['accept-language'],
                        lead: leadJson,
                    }, req.__("ADDED_LEAD"));
                } else {
                    return res.warn('', req.__('EMAIL_EXISTS'));
                }

            }

        } catch (err) {
            return next(err)
        }
    }

    async invite_leads(req, res, next) {
        let {
              email
            } = req.body;
        console.log(req.body)
        //admin.emailToken = generateResetToken();
        try {
            var mailSent = mailer
                .sendMail(
                'email-invitation',
                req.__('INVITATION_EMAIL'),
                email,
                {
                }
                ).then(() => {
                    return res.success(' ', req.__('INVITATION_EMAIL_SENT'));
                })
                .catch(error => {
                    logError(`Failed to send mail ${email}`);
                    logError(error);
                    return res.warn(' ', req.__('EMAIL_NOT_SENT'));
                });

        } catch (err) {
            return next(err)
        }
    }
    async profileUpdateAddress(req, res, next) {
        
        try {
            let _id = req.user._id;
            let user = await Practice.findOne({
                userId:_id
            });
            var address = {};
            address['shippingAddress'] =  user.shipping_address;
            if( address['shippingAddress']!='' && typeof address['shippingAddress']!='undefined' ){
                var state = '';    
                state = await State.findOne({
                        _id: user.state,
                });
                address['state'] = state['name'];
                address['city']  = user['city'];
                address['zipCode']= user['zip'];
                address['country'] = user['country'];
                return res.success(JSON.parse(JSON.stringify(address)),req.__('Get_shipping_Address'));
               
            }
           
        } catch (err) {
            return next(err)
        }
    }

    
    async updateProfile(req, res, next) {
        let {
             firstname, lastname, email, mobile, radius,predetermine
        } = req.body;
        try {
            let user = await User.findOne( { _id:req.user._id } );
            if(user){
            user.firstname = firstname;
            user.lastname = lastname;
            user.email = email;
            user.mobile = mobile;
            user.radius = radius;
            user.likeCount = predetermine;
            user = await user.save();
            const userJson = user.toJSON();
            return res.success({
                "language": req.headers['accept-language'],
                user: userJson
            },req.__('PROFILE_UPDATED'));
            } else {
                return res.warn('',req.__('USER_NOT_FOUND')); 
            }
           
        } catch (err) {
            return next(err);
        }
    }

    async productList(req, res, next) {
         let {
            categoryId,
            subCategoryId,
            limit,
            offset,
            subCatId,
            vendorIds
        } = req.body;
        console.log("body",req.body);
        if(typeof limit=='undefined' || limit==''){
           limit = 10;
        }
        if(typeof offset=='undefined' || offset==''){
           offset = 0;
        }
        if(typeof categoryId=='undefined' || categoryId==''){
           res.warn('', req.__('Select_Category'));
        }
        let role = req.role;
        let id = req._id;
        let and = [];
        let query = {
            isDeleted: false,
            isSuspended: false
        };
        if(categoryId!=''){
            and.push({"categoryId":ObjectId(categoryId)})
        }
        if( typeof subCatId!='undefined' && subCatId!=''){
           and.push({"subcategoryId":ObjectId(subCatId)}) 
        }
        if( typeof vendorIds!='undefined' && vendorIds.length>0)
        {
            let id = [];
            _.each( vendorIds,(vedorId)=>{
                id.push(ObjectId(vedorId));
            })
            console.log("id",id);
            and.push({"vendorId":{ $in: id}});
        }
        query.$and =  and;
        let count = await Product.countDocuments(query);
        console.log("totol",count);  
        if(role=="practice"){
          Product.aggregate([{
            "$match":{
            "$and":[
                    {"$and":and},
                    {isDeleted:false,isSuspended:false},
                    ]
                }
            },
            {
                $skip:offset
            },
            {
                $limit:limit
            },
          
            {
                $lookup:{
                   "from":"vendors",
                    "foreignField":"_id",
                    "localField":"vendorId",
                    "as":"vendors"
                }
            }
        ]).exec((err, result)=>{
            if (err) {
               res.warn('', req.__('ERROR_DATA'))
            }
            if (result) {
               
                res.success({allProducts:result,totalProducts:count}, req.__('GET_DATA'))
               
            }
        });
         //res.success({allProducts:products}, req.__('GET_DATA'));
        
        } else {
           res.warn('', req.__('LOGIN_WITH_PRACTICE_ROLE')) 
        }
       
      
    }
 
      async subCatAndVendorList(req, res, next) {
        let {
             categoryId
        } = req.query;
        if(typeof categoryId=='undefined' || categoryId==''){
           res.warn('', req.__('Select_Category'));
        }
        try {
            let _id = req.user._id;
            let Category = await Categories.findOne({
                _id:categoryId,
               
            });
            let subCategories = await Categories.find({
                parentId:categoryId,
                isDeleted:false,
                isSuspended:false
            });
            let vendors = await Vendor.find({
               isDeleted:false,
               isSuspended:false
            });
            return res.success({
                category:Category,
                subCategories:subCategories,
                vendors:vendors
            });
            
           
        } catch (err) {
            return next(err)
        }
    }
  
    async vendorSearch(req, res, next){
    let reqData = req.query;
   
    let query = {
            isDeleted: false,
            isSuspended: false
        };
     if (reqData.business_name) {
            const searchValue = new RegExp(
                reqData.business_name
                    .split(' ')
                    .filter(val => val)
                    .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
                    .join('|'),
                'i'
            );

            query.$or = [
                { business_name: searchValue }
            ];
        }    
      let data= await Vendor.find(query);
      return res.success(data, req.__('SEARCH_SUCCESSFULLY'));
    }

    async myPractices(req, res, next){
    let { userId } =  req.user._id;
    try{
        let practiceUser = await Practice.findOne({ userId: userId }).select('associate_practices').populate('associate_practices', `email`)
        .lean();
  
        if (practiceUser) {
         res.success(practiceUser, req.__("ASSOCIATE_USER_lIST"));
        } else {
        res.warn('', req.__("USER_NOT_FOUND"));
        }
        

    } catch (err) {
        return next(err) 
    }
      return res.success(data, req.__('SEARCH_SUCCESSFULLY'));
    }

    async associatePractice(req, res, next) {
        console.log(req.body);
        let { email }  = req.body;
        //let reqData = req.query;
        console.log("req",email);
          
        try {
            let practiceUser = await Practice.findOne({ email: email, 'isDeleted': false, 'isSuspended': false });
            if (practiceUser) {
                let loginPracticeUser = await Practice.findOne({ userId: req.user._id, 'isDeleted': false, 'isSuspended': false });
                if(loginPracticeUser){
                loginPracticeUser.associate_practices = practiceUser._id;
                let response = await loginPracticeUser.save();
                
                return res.success(response, req.__("ASSOCIATED_PRACTICE_ADDED"))
                } else {
                    return res.warn('', req.__("USER_NOT_FOUND"));
                }
            } else {
                return res.warn('', req.__("USER_NOT_FOUND"));
            }

        } catch (err) {
            return next(err)
        }
    }

    

    async addAddress(req, res, next) {
        let {
            _id,
            flatNo,
            address,
            postcode,
            addressName,
            note,
            phoneNumber,
            lat,
            lng,
            isDefault
        } = req.body;

        try {
            //addressName = addressName.toLowerCase();
            if(!lat){
                lat = 0;
                lng = 0;
            }


            if (isDefault == undefined) {
                isDefault = false
            }
            let location = [lng, lat]
            

            let user = await User.findOne({ _id: req.user._id }).select('address location')
            
            // var newAddress = true
            // if( user.address && user.address.length>0 ){
            //     _.each(  user.address,(x)=>{
            //         if( newAddress==true && x.addressName.toLowerCase() == addressName.toLowerCase() ){
            //             newAddress = false;
            //         }
            //     })
            // }
            
           if( !(_id && _id!="") ){
                let updatedata = {
                    $addToSet: {
                        address: { flatNo, address, postcode, addressName, phoneNumber, location, isDefault, note,
                        }
                    }
                }
                if (isDefault == true) {
                    await setDefaultLocationFalse(req.user._id);
                    updatedata['$set'] = { "location": [lng, lat] }
                }
                await User.findOneAndUpdate(
                    {
                        _id: req.user._id
                    },
                    updatedata
                )
                if (user.isDefault == true) {
                    user.location = [lng, lat]
                }
                await user.save()
                return res.success('', req.__('DELIVERY_ADDRESS_ADD'));
           }else{
            

                if( user.address && user.address.length>0 ){
                    let found = false;
                    _.each( user.address,(x)=>{
                        if( !found && _id.toString() == x._id.toString() ){
                            found = true;
                            if(flatNo) x.flatNo= flatNo;
                            if(address) x.address= address;
                            if(postcode) x.postcode= postcode;
                            if(addressName) x.addressName= addressName;
                            if(note) x.note= note;
                            if(phoneNumber) x.phoneNumber= phoneNumber;
                            if(isDefault) x.isDefault=isDefault
                            if(location) x.location= location
                        }
                    })
                }


                // if (isDefault == true) {
                //     user.location = [lng, lat]
                // }
                if (isDefault == true) {
                    await setDefaultLocationFalse(req.user._id);
                    user.location = [lng, lat]
                }
                await user.save()
                return res.success('', req.__('DELIVERY_ADDRESS_EDIT'));

           }
            

        } catch (err) {
            return next(err)
        }

    }


    async deleteAddress( req,res,next ){
        let {
            addressId
        } = req.body;
        try{
            let user = await User.findOne({
                _id:req.user._id
            })
            .select("_id address")

            var canDelete = true;
            _.each( user.address,(x) =>{
                if( x._id.toString() == addressId &&
                    x.addressName.toLowerCase() == "current location"
                ){
                    canDelete = false;
                }
            })
            //console.log("user",user)
            console.log("can",canDelete)
            //return;

            if( canDelete == false ){
                return res.warn('', req.__('CANT_DELETE_CURRENT_ADDRESS'));
            }else{
                user.address = user.address.filter( x=> x._id.toString() != addressId )
                await user.save();
                return res.success('',req.__('ADDRESS_DELETED_SUCCESSFULLY')  );

            }



        }catch( err ){
            return next(err)
        }

    }


    
    async setCurrentAddress(req, res, next) {
        try {
            let {
                address_id
            } = req.body;
            await setDefaultLocationFalse(req.user._id);

            await User.updateOne(
                {
                    _id: req.user._id, "address._id": address_id
                }, {
                $set: { "address.$.isDefault": true }
            }
            )
            return res.success('', req.__('SUCCESS'));

        } catch (err) {
            return next(err)
        }
    }


    async addressName(req, res, next) {
        let user = await User.findOne({ _id: req.user._id }).select("_id address")
        let address = [
            {
                "key": "home",
                "nameEN": "Home",
                "nameCHN": "Home"
            },
            {
                "key": "work",
                "nameEN": "Work",
                "nameCHN": "Work"
            }
        ]

        _.each(  user.address,(x)=>{
            if( !(x.addressName.toLowerCase()=='home' || x.addressName.toLowerCase() == "work" ||  x.addressName.toLowerCase() == "current location" ) ){
                address.push({
                    "key": x.addressName.toLowerCase(),
                    "nameEN": x.addressName,
                    "nameCHN": x.addressName
                })
            }
        })
        address = _.uniqBy(address, 'key');


        res.success(address)
    }

    async updateLanguage( req,res,next ){
        let {
            language
        } = req.body
        await User.update(
            {
                _id: req.user._id
            },{
                $set:{
                    language
                }
            }
        )
        res.success('' ,req.__('LANGUAGE_UPDATE_SUCCESS') )

    }

    async contactChangeRequest( req,res,next ){
        let {
            countryCode, mobile
        } = req.body;
        let userId = req.user._id;
        try{
            let user = await User.findOne({ countryCode,mobile,isDeleted:false }).select("_id countryCode mobile")
            console.log("userssss",user)
            if( user ){
                return res.warn('', req.__('MOBILE_EXISTS'));
            }else{
                let otp = generateOtp();
                let tempMobile = {
                    countryCode,mobile
                }
                
                await User.updateOne({
                    _id:userId
                },{
                    $set:{
                        tempMobile,otp
                    }
                })



                //todo send sms
                return res.success('',req.__('OTP_SEND_SUCCESS'));
            }

        }catch( err ){
            return next(err)
        }
    }
    async contactChangeOtpVerify( req,res,next ){
        let {
            otp
        } = req.body;
        try{
            let user = await User.findOne( { _id:req.user._id } )
            if( user.otp == otp ){
                user.countryCode = user.tempMobile.countryCode;
                user.mobile = user.tempMobile.mobile;
                user.tempMobile = {}
                await user.save();
                return res.success('',req.__('MOBILE_UPDATE'));
            }else{
                return res.warn('',req.__('INVALID_OTP'));
            }
        }catch(err){
            return next(err)
        }
    }

    async contactUs( req,res,next ){
        let {
            subject,type,message
        } = req.body;
        try{
            let userId = req.user._id;
            return res.success('', req.__('CONTACT_REQUEST_SEND') );

        }
        catch(err){

        }

    }
    async uploadProfile(req, res, next) {
        let {
            profileImage, imageName
        } = req.body;
        let user = await User.findOne({ _id: req.user._id });
        try {
            const upload = multer({ dest: 'uploads/' }).single("profileImage");
            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).send("Something went wrong!");
                }
                const file = req.file;
                console.log(file);

                let image = await uploadImageAPI(file,'user');
                console.log(image);
            
                user.avatar = image.key;
                await user.save();
                return res.success({ imageUrl: image.Location }, req.__('IMAGE_SUCCESS'));

            });

        } catch (err) {
            console.log(err);
            return next(err)
        }

    }

    async setLikeCount(req, res, next) {
        const { user, likeCount } = req;
        try {
            let userId = req.user._id;
            let oldLikeCount = req.user.likeCount;
            if (req.body.likeCount) {
                let user = await User.findOneAndUpdate({ _id: userId }, { likeCount: req.body.likeCount, like_time: Date.now() }, { new: true });
                return res.success({ user }, req.__('LIKE_UPDATED'));

            } else {
                let user = await User.findOneAndUpdate({ _id: userId }, { likeCount: oldLikeCount });
                return res.success({ user }, req.__('PREVIOUS_LIMIT'));
            };

        } catch (err) {
            res.next(err);
        }
    }

    async knowlike(req, res, next) {
        const { user } = req;
        try {
            let userId = req.user._id;
            let likeLimit = req.user.likeCount;

            let timestamp1 = Date.now();
            console.log(timestamp1);
            let timestamp2 = user.like_time;

            var hours = Math.abs(timestamp1 - timestamp2) / 36e5;
            console.log(hours);
            let showPop = false;
            if (hours > 24) {
                showPop = true
            } else {
                showPop = false
            }

            let start = new Date();
            start.setHours(0, 0, 0, 0);
            let end = new Date();
            end.setHours(23, 59, 59, 999);

            let count = await LikeDislike.find({ userId: req.user._id, created: { $gte: start, $lt: end } })
            let liked;
            if (count.length > 0){
                liked = count.length;
            }else{
                liked = 0
            }
            return res.success({
                liked:liked,
                likeLimit:likeLimit,
                showPop:showPop
            }, "Total like today in liked")

        } catch (err) {
            res.next(err);
        }
    }

    async setRadius(req, res, next) {
        const { user } = req;
        try {
            let user = await User.findOne({ _id: req.user._id });
            if (user) {
                let user = await User.findOneAndUpdate({ _id: req.user._id }, { radius: req.body.radius }, { new: true });
                return res.success({ user }, req.__('RADIUS_UPDATED'));
            } else {
                res.warn('', req.__('USER_NOT_FOUND'))
            }
        } catch (err) {
            res.next(err);
        }
    }

    async fetchCategories(req, res, next) {
        const { user } = req;
        try {
            let userLike = await User.findOne({ _id: req.user._id });
            var pageNo = parseInt(req.query.pageNo)
            var size = parseInt(req.query.size)
            var query = {}
            if (pageNo < 0 || pageNo === 0) {
                response = { "error": true, "message": "invalid page number, should start with 1" };
                return res.json(response)
            }
            query.skip = size * (pageNo - 1)
            query.limit = size
            // Find some documents
            let foodItems  = await Food.find({}, {}, query).populate("categoryId", 'name');
            res.success({ foodItems }, 'Successfully got the cards')

        } catch (err) {
            res.next(err);
        }
    }

    async notification(req, res, next) {
        const { user, notificationValue } = req;
        try {
            let userId = req.user._id;

            let user = await User.findOneAndUpdate({ _id: userId }, { isNotification: req.body.notificationValue }, { new: true });
            return res.success({ user }, "Notification added");

        } catch (err) {
            res.next(err);
        }
    }

    async stepSkip(req, res, next) {
        const { user, skip } = req;
        try {
            let userId = req.user._id;
            let findUser = await User.findOne({ _id: req.user._id });
            if (!findUser) {
                return res.notFound('', req.__('INVALID_REQUEST'));
            } else {
                let user = await User.findOneAndUpdate({ _id: userId }, { skipTwoStep: req.body.skip }, { new: true });
                return res.success({
                    user,
                    msg: "skip_setting updated successfully",
                },"skip_setting updated successfully");
            }
        } catch (err) {
            res.next(err);
        }
    }



}

async function setDefaultLocationFalse(_id) {
    return await User.updateOne(
        {
            _id, "address.isDefault": true
        }, {
        $set: { "address.$.isDefault": false }
    }
    )
}


module.exports = new UserController();

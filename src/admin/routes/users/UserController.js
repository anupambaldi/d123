const {
    models: {User, Country, State, City, Rating, AdminNotification, Static}
} = require('../../../../lib/models');
const {showDate, uploadImageLocal} = require('../../../../lib/util');
bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
const fs = require('fs');
const multiparty = require('multiparty');
var FCM = require('fcm-node');


class UserController {
    async listPage(req, res) {
        return res.render('users/list');
    }

    async addUserPage(req, res) {
        return res.render("users/add");
    }

    async addUserSave(req,res, next) {
        const exist = await User.find({email:req.body.email})
        console.log(exist);

        if(exist.length>0){
            req.flash('error', "User already exist");
            return res.redirect('/users/add'); 
        }
        else{
            
        let data = req.body;
        let user = {};
        user.firstname = data.firstname;
        user.lastname = data.lastname;
        user.email = data.email;
        user.password = await bcrypt.hash(data.password, saltRounds);
        user.mobile = data.mobile;
        user.radius = data.radius
        user.predetermine = data.predetermine;
        user.emailVerify = false;
        let saveuser = new User(user);
        await saveuser.save();
        req.flash('success', req.__('USER_ADD_SUCCESS'));
            return res.redirect('/users');
        }
    }

    async list(req, res) {
        
        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            email:{$ne:null},
            //isDeleted: false,
        };

        if (reqData.search.value) {
            const searchValue = new RegExp(
                reqData.search.value
                    .split(' ')
                    .filter(val => val)
                    .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
                    .join('|'),
                'i'
            );

            query.$or = [
                {name: searchValue},
                {email: searchValue},
                {countryCode: searchValue},
                {mobile: searchValue},
            ];
        }
        let sortCond = {created: sortOrder};
        let response = {};
        switch (columnNo) {
        case 1:
            sortCond = {
                name: sortOrder,
            };
            break;
        case 2:
            sortCond = {
                isSuspended: sortOrder,
            };
            break;
        default:
            sortCond = {created: sortOrder};
            break;
        }

        const count = await User.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let users = await User.find(query)
            .sort(sortCond)
            .skip(skip)
            .limit(limit);
        if (users) {
            users = users.map(user => {
                let actions = '';
                actions = `${actions}<a href="/users/view/${user._id}" title="view"><i class="fas fa-eye"></i></a>`;
                actions = `${actions}<a href="/users/edit/${user._id}" title="Edit"><i class="fas fa-edit"></i></a>`;
                if (user.isSuspended) {
                    actions = `${actions}<a class="statusChange" href="/users/update-status?id=${user._id}&status=false&" title="Activate"> <i class="fa fa-check"></i> </a>`;
                } else {
                    actions = `${actions}<a class="statusChange" href="/users/update-status?id=${user._id}&status=true&" title="Inactivate"> <i class="fa fa-ban"></i> </a>`;
                }
                if (user.isDeleted) {
                    actions = `${actions}<a class="deleteItem" href="/users/delete-restore/${user._id}" title="Restore"> <i class="fas fa-trash-restore"></i> </a>`;
                }else {
                    actions = `${actions}<a class="deleteItem" href="/users/delete/${user._id}" title="Delete"> <i class="fas fa-trash"></i> </a>`;

                }

                return {
                    0: (skip += 1),
                    1: user.email,
                    2: user.isSuspended ? '<span class="badge label-table badge-secondary">In-Active</span>' : '<span class="badge label-table badge-success">Active</span>',
                    3: user.isDeleted ? '<span class="badge label-table badge-secondary">Yes</span>' : '<span class="badge label-table badge-success">No</span>',
                    4: actions,
                };
            });
        }
        response.data = users;
        return res.send(response);
    }


    async editUserPage(req, res) {
        let id = req.params.id;

        let user = await User.findOne({_id:id})
        .lean();
        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }
        return res.render("users/edit", {user});
    }
    async editSave(req, res, next){
        var id = req.params.id;
        let data = req.body;
        let user = await User.findOne({_id:id});
        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }

        user.firstname = data.firstname;
        user.lastname = data.lastname;
        user.email = data.email;
        user.mobile = data.mobile;
        user.radius = data.radius
        user.predetermine = data.predetermine;
        await user.save();

        req.flash('success', id ? req.__('USER_UPDATED_SUCCESS') : req.__('USER_UPDATED_SUCCESS'));
        return res.redirect('/users');
    }

    async view(req, res) {
        let user = await User.findOne({
            _id: req.params.id,
            isDeleted: false
        }).lean();

        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }

        return res.render('users/view', {
            user
        });
    }

    async updateStatus(req, res) {
        const {id, status} = req.query;
        let user = await User.findOne({
            _id: id,
            isDeleted: false
        });

        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }

        user.isSuspended = status;
        await user.save();

        req.flash('success', req.__('USER_STATUS_UPDATED'));
        return res.redirect('/users');
    }

    async uploadProfilePic(req, res){
        
        let userId = req.params.id;
        let form = new multiparty.Form();
        
        form.parse(req, async function(err, fields, file) {
            
            let fileName = file['file'][0].originalFilename;

            let extension = fileName.substr( (fileName.lastIndexOf('.') +1) );
            fileName = userId + '.' + extension;

            let tmp_path = file['file'][0].path;
            let target_path = `${process.env.UPLOAD_IMAGE_PATH}` + 'users/' + fileName;
            try{
                
                let image = await uploadImageLocal(tmp_path,target_path,fileName);
                
                let user = await User.findOne({
                    _id: userId,
                    isDeleted: false
                });
                user.avatar = fileName;
                await user.save();
                req.flash('success', "Profile image successfully uploaded!");
                return res.success({'status':'success','image':image});

            }catch( err ){
                return res.success({'status':'fail'});
            }
          
          }); 
        
    }

    async delete(req, res) {
        const user = await User.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }

        user.isDeleted = true;
        await user.save();

        let ratings = await Rating.find({userId:req.params.id});
        if(ratings.length > 0) {
            ratings.forEach(async (item)=>{
                let res = await Rating.findOneAndUpdate({ _id:item._id},{isDeleted:true});
            })
        }

        req.flash('success', req.__('USER_DELETE_SUCCESS'));
        return res.redirect('/users');
    }

    async deleteRestore(req, res) {
        const user = await User.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!user) {
            req.flash('error', req.__('USER_NOT_EXISTS'));
            return res.redirect('/users');
        }
        user.isDeleted = false;
        await user.save();

        req.flash('success', req.__('USER_DELETE_SUCCESS'));
        return res.redirect('/users');
    }

    async isEmailExists(req, res) {
        const { email } = req.body;

        const count = await User.countDocuments({email: email});

        return res.success(count);
    }

    async broadcast(req, res) {
        const users = await User.find({})
        res.render('broadcast', { user: users });
    }

    async broadcast_push(req, res) {
        let selectedUser = [];
        const check = req.body.all_user;
        const msg = req.body.message
        selectedUser = req.body.users
       console.log(Array.isArray( selectedUser))
        if(Array.isArray( selectedUser)==true){
        let fcmToken = [];
        if (check == "true") { 
            let users = await User.find({ isDeleted: false }).select("_id deviceToken")
            users.forEach((detail, i) => {
                fcmToken = fcmToken.concat(detail.deviceToken);
            })

            await Promise.all(users.map(async (i)=>{
                let notification = {};
                notification.notification_title = "Message from Admin";
                notification.description =msg;
                notification.recieverId = i;
                let notify = new AdminNotification(notification);
                await notify.save();
            }))
            
        }else {
            fcmToken = await Promise.all(selectedUser.map(async (i) => {
                let data = await User.find({_id:i}).select("_id deviceToken")
                return data[0].deviceToken;
            }));

            await Promise.all(selectedUser.map(async (i)=>{
                let notification = {};
                notification.notification_title = "Message from Admin";
                notification.description =msg;
                notification.recieverId = i;
                let notify = new AdminNotification(notification);
                await notify.save();
            }))
            
        }

        var serverKey = 'AAAAzZA4sMk:APA91bGohanC9uCg8Vhl3qcvdqCfpBSWb6fC6ImcPc1frmWqj1Q8XusEQqbZVlQcQ9vGNfSNjpKIssicfIPdlG-6eutICnvH-vIOzgtmr3Xw_v8cai9OAEoYywr_lCUnGYYWlrGIFtKh'; //put your server key here
        var fcm = new FCM(serverKey);

        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            registration_ids: fcmToken,
            notification: {
                title: 'Message from Admin',
                body: msg
            },
            data: {  //you can send only notification or only data(or include both)
                screen: 'home',
            }
        };

        fcm.send(message, async function (err, response) {
            if (err) {
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        })

        req.flash('success', 'Request send successfully')
        res.redirect('/users/broadcast');

        }
        
    else{

        console.log("90909099")
        let data = await User.find({ _id: selectedUser }).select("_id deviceToken")
        console.log(data);

        var serverKey = 'AAAAzZA4sMk:APA91bGohanC9uCg8Vhl3qcvdqCfpBSWb6fC6ImcPc1frmWqj1Q8XusEQqbZVlQcQ9vGNfSNjpKIssicfIPdlG-6eutICnvH-vIOzgtmr3Xw_v8cai9OAEoYywr_lCUnGYYWlrGIFtKh'; //put your server key here
        var fcm = new FCM(serverKey);

        var token = data[0].deviceToken;
        //console.log(token);

        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: token,
            notification: {
                title: `Message from Admin`,
                body: msg
            },
            data: {  //you can send only notification or only data(or include both)
                screen: `home`,
            }
        };

        fcm.send(message, async function (err, response) {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully sent with response: ", response);
            
                let notification = {};
                notification.notification_title = "Message from Admin";
                notification.description =msg;
                notification.recieverId = selectedUser;
                let notify = new AdminNotification(notification);
                await notify.save();

                req.flash('success', 'Request send successfully')
                res.redirect('/users/broadcast');
            }
        })

    }

    }
    
    async privacy_policyPage(req, res) {
        let cms = await Static.findOne({slug:"privacy_policy"});
         const content =cms.content
        const name = cms.page_name;
        const id = cms._id;
        res.render('static',{name,content,id} );
    }


    async termsAndconditionPage(req, res) {
        console.log("privacy")
        let cms = await Static.findOne({slug:"terms_conditions"});
         const content =cms.content
        const name = cms.page_name;
        const id = cms._id;
        res.render('static',{name,content,id} );
    }

    async Static(req, res) {
        const id = req.query.id;
        // const content = req.body.content;
       let originalString = req.body.content;
        let strippedString = originalString.replace(/(<([^>]+)>)/gi, "");
        const cms = await Static.findOneAndUpdate({_id:id},{content:strippedString},{new:true});
      
        if(cms.slug == "terms_conditions"){
            req.flash('success',"Successfully updated")
            res.redirect("/users/terms_conditions")         
        }

    else if(cms.slug == "privacy_policy"){
        req.flash('success',"Successfully updated")
            res.redirect("/users/privacy_policy")         
        }
    }
}

module.exports = new UserController();
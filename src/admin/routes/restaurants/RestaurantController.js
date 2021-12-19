const {
    models: { Categories, Restaurant, Food, Rating, DupRestaurant, EditRestaurant},
} = require('../../../../lib/models');
const multiparty = require('multiparty');
const _ = require('lodash');
const {showDate,uploadImage,uploadImageAPI} = require('../../../../lib/util');
const objectId = require('../../../../lib/util/index');

const multer = require('multer');
const path = require('path');
const uploadshow = `${process.env.SITE_URL}/uploads`

const upload = path.join(__dirname, '../../static/uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, upload),

    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
})

const handleMultipartData = multer({
    storage,
    limits: { fieldSize: 1000000 * 10 }
}).single('food_image');

const async = require('async');

class RestaurantController {

    async listPage(req, res) {
        return res.render('restaurants/list');
    }

    async list(req, res) {

        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            //isDeleted: false
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
                { name: searchValue }
            ];
        }

        let sortCond = { created: sortOrder };
        //let sortCond = { created: sortOrder };
        let response = {};
        switch (columnNo) {
            case 1:
                sortCond = {
                    name: sortOrder,
                };
                break;
            case 2:
                sortCond = {
                    email: sortOrder,
                };
                break;
            default:
                sortCond = { created: sortOrder };
                break;
        }

        const count = await Restaurant.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let restaurants = await Restaurant.find(query)
            .sort(sortCond)
            .skip(skip)
            .limit(limit)
            .lean();
        if (restaurants) {
            restaurants = restaurants.map(restaurant => {
                let actions = '';
                let img = process.env.AWS_BASE_URL;
                var restaurantimage;
                var yelpid = restaurant.yelp_id;

                if (typeof yelpid != "undefined") {
                    restaurantimage = `<img src="${restaurant.image_url}" class="imm" width="60px" height="50px" />`;
                } else {
                    restaurantimage = `<img src="${restaurant.image_url}" class="imm" width="60px" height="50px" />`;
                }

                //console.log(img);
                actions = `${actions}<a href="/restaurants/edit/${restaurant._id}" title="Edit"> <i class="fas fa-edit"></i> </a>`;
                actions = `${actions}<a href="/restaurants/view/${restaurant._id}" title="View"> <i class="fas fa-eye"></i> </a>`;
                actions = `${actions}<a href="/restaurants/food_list/${restaurant._id}" title="Food List"><i class="fas fa-cheese"></i> </a></a>`;

                if (!restaurant.isDeleted) {
                    if (restaurant.is_active) {
                        actions = `${actions}<a class="statusChange" href="/restaurants/update-status?id=${restaurant._id}&status=false&" title="Activate"> <i class="fa fa-check"></i> </a>`;
                    } else {
                        actions = `${actions}<a class="statusChange" href="/restaurants/update-status?id=${restaurant._id}&status=true&" title="Inactivate"> <i class="fa fa-ban"></i> </a>`;
                    }
                }
                if (restaurant.isDeleted) {
                    actions = `${actions}<a class="deleteItem" href="/restaurants/delete-restore/${restaurant._id}" title="Restore"> <i class="fas fa-trash-restore"></i> </a>`;
                } else {
                    actions = `${actions}<a class="deleteItem" href="/restaurants/delete/${restaurant._id}" title="Delete"> <i class="fas fa-trash"></i> </a>`;
                }
                return {
                    0: (skip += 1),
                    1: restaurantimage,
                    2: restaurant.name,
                    3: restaurant.rating,
                    //4: restaurant.review_count? restaurant.review_count : '',
                    4: restaurant.phone,
                    5: restaurant.isDeleted ? '<span class="badge label-table badge-secondary">Yes</span>' : '<span class="badge label-table badge-success">No</span>',
                    6: actions,
                };
            });
        }

        response.data = restaurants;
        return res.send(response);
    }

    async addPage(req, res) {
        //console.log(req.user)
        let categories = await Categories.find({}).lean();
        return res.render('restaurants/add',{categories});
    }

    async add(req, res, next){
        let restaurant = {};
       // let categories = await Categories.find({}).lean();

        let form = new multiparty.Form();
        
        form.parse(req, async function(err, fields, files) {
            //console.log(fields);
            let additional = files.additional_images;
            let fileupload = files.image[0]           
            let loc = [];
            let coordinate = {};
            let transaction = [];
            let location = {};
            let display_address = [];
            let addline2 = '';

            _.forOwn( fields,(field,key)=>{
                if(key == 'categories'){
                    //restaurant[key] = field;
                    let objArr=[];
                    field.forEach((item,index)=>{
                        let objectRest = objectId.createObjectId(item)
                        objArr = objArr.concat(objectRest);
                    })
                    restaurant[key] = objArr;
                }else if(key == 'pickup' || key == 'delivery'){
                    transaction.push(key);
                }else if(key == 'latitude' || key == 'longitude'){
                    coordinate[key] = field[0];
                }else if(key == 'address1' || key == 'address2' || key == 'address3' || key == 'zip_code' || key == 'country' || key == 'state' || key == 'city'){
                    if(key == 'address1'){
                        display_address.push(field[0]);
                    }
                    if(key == 'city' || key == 'state'|| key == 'zip_code'){
                        addline2 = addline2+ ' ' + field[0]
                    }
                    
                    location[key] = Object.assign(field[0]);
                }else{
                    restaurant[key] = field[0];
                }
            })

            let categories = await Categories.find({}).lean();    
            let name;
            let url;
            name = restaurant['name'];
            url = restaurant['url'];
            const exist = await Restaurant.find({$or: [
                {url: url},
                { $and : [{name: name,url:""}]}
            ]})
            console.log(exist);
            if(exist.length > 0){
                let dupName = exist[0].name;
                let msg = `Restaurant with ${dupName} is already exist with same Url or name`;
                req.flash('error', req.__(msg));
                return res.redirect('/restaurants');
            }
           
          //  console.log("============================");
          //  console.log(location);
            display_address.push(addline2);
            location['display_address'] = Object.assign(display_address);

            loc.push(coordinate['longitude']);
            loc.push(coordinate['latitude']);
            restaurant.loc = {"type:":'Point',coordinates:loc};

            restaurant['transactions'] = transaction;
            restaurant['location'] = location;
            console.log(additional);           
            //console.log(restaurant);
           
            let additionalArr=[];

            additionalArr = await Promise.all(additional.map(async (i) => {
                console.log(i);
                let image = await uploadImage(i,'restaurant');
                console.log(image);
                return image.Location;
            }));

            restaurant['additional_image_url'] = additionalArr;
            
            try{
                let image = await uploadImage( fileupload,'restaurant' );
                //console.log(image);
                restaurant['image_url'] = image.Location;
                let saverestaurant = new Restaurant(restaurant);  
                                     
                await saverestaurant.save();           
                req.flash('success', req.__('RESTAURANT_ADD_SUCCESS'));
                return res.redirect('/restaurants');
                
            }catch( err ){
                return next(err)
            }
        });
    }

    async view(req, res) {
        let categories = await Categories.find({}).lean();
        let restaurant = await Restaurant.findOne({
            _id: req.params._id,
            //isDeleted: false
        }).populate([
            {'path':'categories','model':'Categories'},
    ]).lean();

        if (!restaurant) {
            req.flash('error', req.__('RESTAURANT_NOT_EXISTS'));
            return res.redirect('/restaurants');
        }
        //console.log(restaurant);
        return res.render('restaurants/view', {
            restaurant, categories
        });
    }

    async editPage(req, res) {
        let _id = req.params._id;
        let categories = await Categories.find({}).lean();
        let restaurant = await Restaurant.findOne({
            _id,
            isDeleted: false
        }).lean();
        let editRestaurant;

        console.log(restaurant.yelp_id);
        if((typeof restaurant.yelp_id !== 'undefined') && (restaurant.yelp_id !== null)) {
            console.log("Yelp Id is present here");
            editRestaurant = await EditRestaurant.findOne({restaurantId:_id})
            //console.log(editRestaurant);
            if(editRestaurant == null) {
               // let newRes = {};
               // newRes[]
               let saverestaurant = new EditRestaurant();
               saverestaurant.restaurantId =  _id;
               saverestaurant.phone = false;
               saverestaurant.url = false;
               saverestaurant.name = false;
               let newRes = await saverestaurant.save();
               editRestaurant = newRes;
               //console.log(newRes);
            }
        }

        //console.log(editRestaurant.length);
        let otherDisable;
        let phoneDisable;
        let urlDisable;
        let nameDisable;
        console.log(editRestaurant);
        if( (typeof editRestaurant !== 'undefined') && (editRestaurant !== null)) {
            console.log("================================================");
            phoneDisable = (editRestaurant.phone)?"disabled":"";
            urlDisable = (editRestaurant.url)?"disabled":"";
            nameDisable = (editRestaurant.name)?"disabled":"";
            otherDisable = "disabled";
        }else {
            console.log("*************************************************");
            otherDisable = "";
            phoneDisable = "";
            urlDisable = "";
            nameDisable = "";
        }

        if (!restaurant) {
            req.flash('error', req.__('RESTAURANT_NOT_EXISTS'));
            return res.redirect('/restaurants');
        }
        
       // console.log(restaurant.location);
        return res.render('restaurants/edit', { restaurant, categories, editRestaurant, phoneDisable, otherDisable, urlDisable, nameDisable });
    }

    async edit( req,res,next ){
        var _id = req.params._id;
        let restaurant = await Restaurant.findOne({_id,isDeleted: false});
            console.log(restaurant.yelp_id);
        if((typeof restaurant.yelp_id !== 'undefined') && (restaurant.yelp_id !== null)) {
            //console.log("=====================================");
            //console.log(req);
            //let saverestaurant = new Restaurant(restaurant);                        
            //await saverestaurant.save();           
            req.flash('success', "Restaurant has been updated successfully");
            return res.redirect('/restaurants');

        }else {
            //console.log("++++++++++++++++++++++++++++++++++++++++++");
            let form = new multiparty.Form();
        form.parse(req, async function(err, fields, files) {
            //console.log(fields);
            var newImage = false;
            let additional = files.additional_images;
            let fileupload = files.image[0]
            if( fileupload.size>0 ){
                newImage = true;
            }            
            let loc = [];
            let coordinate = {};
            let transaction = [];
            let location = {};
            let display_address = [];
            let addline2 = '';
            _.forOwn(fields, (field, key) => {
                if (key == 'categories') {
                    
                    let objArr=[];
                    field.forEach((item,index)=>{
                        let objectRest = objectId.createObjectId(item)
                        objArr = objArr.concat(objectRest);
                    })
                    restaurant[key] = objArr;

                    //restaurant[key] = field;
                } else if (key == 'pickup' || key == 'delivery') {
                    transaction.push(key);
                } else if (key == 'latitude' || key == 'longitude') {
                    coordinate[key] = field[0];
                } else if (key == 'address1' || key == 'address2' || key == 'address3' || key == 'zip_code' || key == 'country' || key == 'state' || key == 'city') {
                    if (key == 'address1') {
                        display_address.push(field[0]);
                    }
                    if (key == 'city' || key == 'state' || key == 'zip_code') {
                        addline2 = addline2 + ' ' + field[0]
                    }

                    location[key] = Object.assign(field[0]);
                } else {
                    restaurant[key] = field[0];
                }
            })
            display_address.push(addline2);
            location['display_address'] = Object.assign(display_address);

            loc.push(coordinate['longitude']);
            loc.push(coordinate['latitude']);
            restaurant.loc = {"type:":'Point',coordinates:loc};

           // console.log("============================");
           // console.log(location);

            restaurant['transactions'] = transaction;
            restaurant['location'] = location;

            if((additional.length ==1 && additional[0].size > 0) || (additional.length > 1) ) {
                let additionalArr=[];

                additionalArr = await Promise.all(additional.map(async (i) => {
                    let image = await uploadImage(i,'restaurant');
                    //console.log(image);
                    return image.Location;
                }));

                restaurant['additional_image_url'] = additionalArr;

            }
            
            
            try{
                if(  newImage ){
                let image = await uploadImage( fileupload,'restaurant' );
                //console.log(image);
                restaurant['image_url'] = image.Location;
                }
                let saverestaurant = new Restaurant(restaurant);                        
                await saverestaurant.save();           
                req.flash('success', "Restaurant has been updated successfully");
                return res.redirect('/restaurants');
                
            }catch( err ){
                return next(err)
            }
        });

        }
          
    }

    async updateStatus(req, res) {
        const { id, status } = req.query;
        let restaurant = await Restaurant.findOne({
            _id: id,
            isDeleted: false
        });

        if (!restaurant) {
            req.flash('error', req.__('RESTAURANT_NOT_EXISTS'));
            return res.render('/restaurants');
        }
        restaurant.is_active = status;
        await restaurant.save();

        req.flash('success', req.__('RESTAURANT_STATUS_UPDATE_SUCCESS'));
        return res.redirect('/restaurants');
    }

    async delete(req, res) {
        const restaurant = await Restaurant.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!restaurant) {
            req.flash('error', req.__('RESTAURANT_NOT_EXISTS'));
            return res.redirect('/restaurants');
        }

        await Food.updateMany({restaurantId:req.params.id},{
            isDeleted: true
        })

        restaurant.isDeleted = true;
        await restaurant.save();

        let ratings = await Rating.find({restaurantId:req.params.id});
        if(ratings.length > 0) {
            ratings.forEach(async (item)=>{
                let res = await Rating.findOneAndUpdate({ _id:item._id},{isDeleted:true});
            })
        }

        req.flash('success', "Restaurant has been deleted successfully");
        return res.redirect('/restaurants');
    }

    async add_food(req, res) {
        // const data = JSON.stringify(req.body)
        // var id =req.params.id

        handleMultipartData(req, res, async (err) => {
            const { food_name, calories, price, description, categories, food_type } = req.body;
            let small_food_type = food_type.toLowerCase();

            if (req.file) {
                
                let image = await uploadImageAPI( req.file,'food' );
                
                const food = new Food({
                    categoryId: categories,
                    restaurantId:req.params.id,
                        calories,
                    food_image: image.Location,
                    food_name,
                    price,
                    description,
                    food_type:small_food_type
                })

                let data = await food.save();
                if(data){
                    req.flash('success', "Food has been added successfully.");
                    return res.redirect(`/restaurants/food_list/${req.params.id}`);
                }
            }
            else {
                const food = new Food({
                    categoryId: categories,
                    restaurantId:req.params.id,
                    calories,
                    food_image: null,
                    food_name,
                    price,
                    description,
                    food_type:small_food_type
                })
                let data = await food.save()
                if(data){
                    req.flash('success', "Food has been added successfully.");
                    return res.redirect(`/restaurants/food_list/${req.params.id}`);
                }
            }

        })
    }

    async add_food_page(req, res) {

        let foodCategory = [];
        let data = [];
        let restid = req.params.id;
        let foodType = ['Favorites','Breakfast','Lunch','Dinner','Dessert'];

        let restaurant = await Restaurant.findOne({
            _id: req.params.id

        });
        if (restaurant) {

            for(let j=0;j<restaurant.categories.length;j++){
                foodCategory[j] = await Categories.find({_id:restaurant.categories[j]});    
            }

            for(let i=0;i<restaurant.categories.length;i++){
                    data[i]=foodCategory[i][0];
            }

            //let categories = await Categories.find({}, { name: 1 });
            // console.log(categories._id);
            
            // categories.forEach((item) => {
            //     foodCategory.push({
            //         "name": item.name,
            //         "id": item._id
            //     })
            // })
        }
        res.render("foods/add", { data, restid, foodType});
        // return res.render('restaurants/edit', { restaurant, categories });
    }

    async food_delete(req, res) {
        const id= req.params.id;
        const detail = await Food.find({_id:id});
        const restaurant = detail[0].restaurantId;
        const data = await Food.deleteOne({ _id: id });

        req.flash('success', "Food has been deleted successfully.");
        return  res.redirect(`/restaurants/food_list/${restaurant}`) ;
    }

    async food_edit_page(req, res) {
        const id  = req.params.id
        let foodCategory = [];
        const data = await Food.find({_id:id})
        let detail = [];
        let foodType = ['Favorites','Breakfast','Lunch','Dinner','Dessert'];

        let restaurant = await Restaurant.findOne({
            _id: data[0].restaurantId

        })
         
        for(let j=0;j<restaurant.categories.length;j++){
            foodCategory[j] = await Categories.find({_id:restaurant.categories[j]});
        }

        for(let i=0;i<restaurant.categories.length;i++){
            detail[i]=foodCategory[i][0];
        }
         
 
       if(data){
         res.render("foods/edit",{data,detail,uploadshow,foodType})
       }   
        else{
            res.redirect('/restaurants/list');
        }
         
     }

     async food_edit(req, res) {
    
        handleMultipartData(req, res, async (err) => {

            const { food_name, calories, price, description, categories, food_type } = req.body;
            //console.log(req.body.food_name);

            let small_food_type = food_type.toLowerCase();

            if(!req.file){  
                const data = await Food.findOneAndUpdate({_id:req.params.id},{food_name, food_type:small_food_type, calories, price, description, categoryId:categories},{new:true});
                //console.log(data)
                //console.log(data.restaurantId)
                if(data){ 
                    req.flash('success', "Food has been updated successfully.");
                    return  res.redirect(`/restaurants/food_list/${data.restaurantId}`)
                }
            }
            else{

                let image = await uploadImageAPI( req.file,'food' );
                const data = await Food.findOneAndUpdate({_id:req.params.id},{food_name,calories, food_type:small_food_type, price, description, categoryId:categories,food_image:image.Location},{new:true});
                if(data){
                    //console.log(data.restaurantId)         
                    req.flash('success', "Food has been updated successfully.");
                    return  res.redirect(`/restaurants/food_list/${data.restaurantId}`)
                }
            }

        })

    }

    async food_list(req, res) {
        const id = req.params.id
        //  let categories = await Categories.find({}).lean();
        let restaurant = await Restaurant.findOne({
            _id: id,
            //isDeleted:false
        });
        const Rname = restaurant.name;

        if (restaurant) {
            const data = await Food.find({ restaurantId: id }).populate({
                path:"categoryId",
                select:"name"}
            )
           //console.log(uploadshow);
            res.render("foods/list", {data ,image:`${uploadshow}`,id:id, Rname:Rname})
        }
    }

    async deleteRestore(req, res) {
        const restaurant = await Restaurant.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!restaurant) {
            req.flash('error', req.__('RESTAURANT_NOT_EXISTS'));
            return res.redirect('/restaurants');
        }
        restaurant.isDeleted = false;
        await restaurant.save();

        req.flash('success', "Restaurant has been restored successfully");
        return res.redirect('/restaurants');
    }

    async duplicateListPage(req, res) {
        return res.render('restaurants/duplicate');
    }

    async duplicateList(req, res) {

        let reqData = req.query;
        let columnNo = parseInt(reqData.order[0].column);
        //console.log("columnNo", columnNo)
        let sortOrder = reqData.order[0].dir === 'desc' ? -1 : 1;
        let query = {
            
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
                { name: searchValue }
            ];
        }

        let sortCond = { created: sortOrder };
        //let sortCond = { created: sortOrder };
        let response = {};
        switch (columnNo) {
            case 1:
                sortCond = {
                    name: sortOrder,
                };
                break;
            case 2:
                sortCond = {
                    email: sortOrder,
                };
                break;
            default:
                sortCond = { created: sortOrder };
                break;
        }

        const count = await DupRestaurant.countDocuments(query);
        response.draw = 0;
        if (reqData.draw) {
            response.draw = parseInt(reqData.draw) + 1;
        }
        response.recordsTotal = count;
        response.recordsFiltered = count;
        let skip = parseInt(reqData.start);
        let limit = parseInt(reqData.length);
        let restaurants = await DupRestaurant.find(query)
            .sort(sortCond)
            .skip(skip)
            .limit(limit)
            .lean();

        // console.log("-------------"+restaurants)
        let originalrestaurants = await Restaurant.find(query)

        if (restaurants) {
            restaurants = restaurants.map(restaurant => {
                let duplicatecase;
                let duplicateof;
                var restaurantimage;
                let actions = '';
                var yelpid = restaurant.yelp_id;

                originalrestaurants.forEach((detail,index)=>{
                    if(restaurant.url.length>0||restaurant.phone.length>0){
                         if(restaurant.url==detail.url){
                            return duplicatecase='URL',duplicateof = `${actions}<a style="font-weight: 400;" href="/restaurants/view/${detail._id}" title="View">${detail.name} </a><span> </span>`;
                         }
                         else if(restaurant.phone==detail.phone){
                             return duplicatecase='Phone no.',duplicateof = `${actions}<a style="font-weight: 400;" href="/restaurants/view/${detail._id}" title="View"> ${detail.name} </a><span> </span>`;
                         }
                    }
                    else{
                         if(restaurant.name==detail.name){
                            return duplicatecase="Name",duplicateof = `${actions}<a style="font-weight: 400;" href="/restaurants/view/${detail._id}" title="View"> ${detail.name} </a><span> </span>`;
                        }
                    }
                   
                })

               
                if (typeof yelpid != "undefined") {
                    restaurantimage = `<img src="${restaurant.image_url}" class="imm" width="60px" height="50px" />`;
                } else {
                    restaurantimage = `<img src="${restaurant.image_url}" class="imm" width="60px" height="50px" />`;
                }

                actions = `${actions}<a href="/restaurants/duplicate-view/${restaurant._id}" title="View"> <i class="fas fa-eye"></i> </a><span> </span>`;
                actions = `${actions}<a href="/restaurants/duplicate-accept/${restaurant._id}" title="Accept"><i class="fa fa-check"> </i></a><span> </span>`;
                actions = `${actions}<a href="/restaurants/duplicate-reject/${restaurant._id}" title="Reject"><i class="fas fa-trash"> </i></a>`;

                return {
                    0: (skip += 1),
                    1: restaurantimage,
                    2: restaurant.name,
                    3: duplicateof,
                    4: duplicatecase,
                    5: restaurant.phone,
                    6: actions,
                };
            });
        }

        response.data = restaurants;
        return res.send(response);
    }

    async duplicateView(req, res) {
        let categories = await Categories.find({}).lean();
        let restaurant = await DupRestaurant.findOne({
            _id: req.params._id,
           
        }).populate([
            { 'path': 'categories', 'model': 'Categories' },
        ]).lean();

        if (!restaurant) {
            req.flash('error', req.__('RESTAURANT_NOT_EXISTS'));
            return res.redirect('/restaurants');
        }

        return res.render('restaurants/view', {
            restaurant, categories
        });
    }

    async duplicateAccept(req,res){
            //console.log('--------------------------------------')
            const id=req.params.id;
            const detail = await DupRestaurant.find({_id:id}).select('-_id');
            if(detail.length>0){
                const urld =detail[0].url;
                let phone =detail[0].phone;
                let name =detail[0].name;
                if(urld.length > 0){
                    const exist = await Restaurant.findOneAndUpdate({url:urld},detail[0],{new:true})
                    if(exist!=null||exist!=''){
                        await DupRestaurant.deleteOne({_id:id});
                        req.flash('success',"Restaurant changes has been accepted successfully");
                        return res.redirect('/restaurants')
                    }
                        return res.redirect('/restaurants');
                }
                else if(phone.length > 0){
                    const exist = await Restaurant.findOneAndUpdate({phone:phone},detail[0],{new:true})
                    if(exist!=null||exist!=''){
                       await DupRestaurant.deleteOne({_id:id});
                       req.flash('success',"Restaurant changes has been accepted successfully");
                    return res.redirect('/restaurants')
                   }
                    return res.redirect('/restaurants');
                }
                else  if(name.length>0){  
                    const exist = await Restaurant.findOneAndUpdate({name:name},detail[0],{new:true})
                    if(exist!=null||exist!=''){
                        await DupRestaurant.deleteOne({_id:id});
                        req.flash('success',"Restaurant changes has been accepted successfully");
                        return res.redirect('/restaurants')
                    }
                    return res.redirect('/restaurants');
                }
                res.redirect('/restaurants'); 
        }
    }

    async isUrlExists(req, res) {

        let { url ,phone,name} = req.body;
         console.log(req.body);
         let urls = await Restaurant.countDocuments({url: url});
         let phones=await Restaurant.countDocuments({phone:phone});
         let named=await Restaurant.countDocuments({name:name});

         if(urls>0 && phones >0){
           
            let datas={
                'urls':urls,
                'phones':phones
            }
            console.log(datas)
            return res.success(datas);
         }
      else if(urls>0  && named>0){

            let datas={
                'urls':urls,
                'name':named
            }
            return res.success(datas);
         }
         else if(urls>0  ){
            let datas={
                'urls':urls,  
            }
            return res.success(datas);
         }else {
            let datas={
                'urls':urls,  
            }
            return res.success(datas);
         }
    
    }

    async isEditUserExists(req,res){
        console.log("hello sir")
        let { url ,phone,name} = req.body;
         console.log(req.body);
         let urls = await Restaurant.countDocuments({url: url});
         let phones=await Restaurant.countDocuments({phone:phone});
         let named=await Restaurant.countDocuments({name:name});

         if(urls>0 && phone >0){
            let datas={
                'urls':urls,
                'phones':phones
            }
            console.log(datas)
            return res.success(datas);
         }
      else if(urls>0  && named>0){
            let datas={
                'urls':urls,
                'name':named
            }
            return res.success(datas);
         }
         else if(urls>0  ){
            let datas={
                'urls':urls,      
            }
            return res.success(datas);
         }  
    } 

    async duplicateReject(req, res) {
        const id = req.params.id;
        let restaurant = await DupRestaurant.findOne({
            _id: id, 
        });
        if (!restaurant) {
            req.flash('error', req.__('RESTAURANT_NOT_EXISTS'));
            return res.render('/restaurants/duplicate-list-page');
        }
        await DupRestaurant.deleteOne({_id:id})
        req.flash('success','Restaurant   Successfully Rejected');
        return res.redirect('/restaurants/duplicate-list-page');
    }
    

}

module.exports = new RestaurantController;

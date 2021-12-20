const {
    models: { User,Logyelp, Practice, Concierge, Country, Vendor,Zip,ProductVendor,Week,Sale, Rating, Restaurant, LikeDislike, VisitRestaurant, FavoriteRestaurant, Setting, Categories, Food, DupRestaurant, AdminNotification }
} = require('../../../../lib/models');
const mailer = require('../../../../lib/mailer');

const sms = require('../../../../lib/sms');
const { signToken } = require('../../util/auth');
const { signTempToken } = require('../../util/auth');
const { getPlatform } = require('../../util/common');
const { utcDateTime,getWeekNumber, generateOtp, logError,adminEmail, randomString, createS3SingnedUrl, generateResetToken, sendSms, uploadImageAPI } = require('../../../../lib/util');
var _ = require('lodash');
const jwtToken = require('jsonwebtoken');
const objectId = require('../../../../lib/util/index');
const multer = require('multer');

var FCM = require('fcm-node');

var serverKey = '*****'; //New Client
var fcm = new FCM(serverKey);

//const { initializeApp } = require("firebase-admin/app");
//initializeApp({
//  credential: applicationDefault(),
//});
//const { compress } = require('compress-images/promise');

//const mailer = require('../../../../lib/mailer');

var SendGridKey = process.env.SENDGRID_API_KEY;
var apiEnv = process.env.NODE_ENV;
//console.log("this is env:",apiEnv);
var moment = require('moment');
var request = require('request');
const rp = require('request-promise');
const async = require('async');


/*var sgTransport = require('nodemailer-sendgrid-transport');
var SGoptions = {
  auth: {
    api_key: SendGridKey
  }
} */

class RestaurantController {
      
  async list_old(req, res, next) {
    try {
      let radius;
      let userid = req.user._id;
      let user = await User.findOne({ _id: userid }).select('radius');
      let userRadius = user.radius;

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

      // Get radius from adminSettings table
      let defaultRadius;
      let data = await Setting.find({ notification_setting: 1 }).select('radius');
      data.forEach((item) => {
        defaultRadius = item.radius
      });
      if (userRadius !== 0) {
        radius = userRadius;
      } else {
        radius = defaultRadius;
      }

      let latitude = req.query.latitude;
      let longitude = req.query.longitude;

      user.deviceToken = req.query.deviceToken;
      user.deviceType = req.query.deviceType;
      await user.save();

      radius = 1000;
      var options = {
        'method': 'GET',
        'url': `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
        'headers': {
          'Authorization': 'Bearer *****x'
        }
      };

      request(options, async function (error, response) {
        if (error) throw new Error(error);
        console.log("===============================================");
        console.log(response.body);
        
        let items = JSON.parse(response.body);
        //res.success({ list:items.businesses });

        console.log("===============================================");
        console.log(items);
        console.log("===============================================");
        console.log(items.businesses.length);
        console.log(radius);
        console.log("===============================================");

        // 1. Save these all in Database first.
        if (items.businesses.length > 0) {
          //Iterate as there might be more than one items
          let arr = items.businesses;

          // getting categories of restaurant seperately  
          // Make an array
          let categoryName = [];
          arr.map((i) => {
            let title = i.categories;
            title.forEach((elem) => {
              if (categoryName.indexOf(elem.title) == -1)
                categoryName.push(elem.title)
            });

          })

          // save in category table the fetched categories
          categoryName.forEach(async (category) => {
            let checkCategory = await Categories.findOne({ name: category });
            if (checkCategory !== null) {
              return false
            } else {
              let addCategory = await Categories.insertMany({ name: category });
            }
          })

          await Promise.all(arr.map(async (i) => {
            // Fetch categories out of saved categories and then save ids in restaurant table
            // make an array of filtered elements
            let categoryArray = [];
            let categoryId = await Categories.find();
            categoryId.map((item) => {
              let title = i.categories;
              let isFound = title.filter((elems) => elems.title.toString() == item.name.toString())
              if (isFound.length > 0) {
                categoryArray = categoryArray.concat(item._id)
              } else {
                return false; // skip
              }
            });

            
            let duplicateRest = await Restaurant.findOne({
              url: i.url, yelp_id: { $exists: false }
            });
            if(duplicateRest){
              let checkInDup = await DupRestaurant.findone({
                yelp_id: i.id
              });
              if (checkInDup){
                return false //skip
              }else {
                let duplicateArr = new DupRestaurant();
                duplicateArr.yelp_id = i.id;
                duplicateArr.name = i.name;
                duplicateArr.alias = i.alias;
                duplicateArr.image_url = i.image_url;
                duplicateArr.is_closed = i.is_closed;
                duplicateArr.url = i.url;
                duplicateArr.review_count = i.review_count;
                duplicateArr.categories = categoryArray;
                duplicateArr.rating = i.rating;
                duplicateArr.price = i.price;
                duplicateArr.location = i.location;
                duplicateArr.phone = i.phone;
                duplicateArr.is_active = 1;
                let loc = [];
                loc.push(i.coordinates.longitude);
                loc.push(i.coordinates.latitude);
                duplicateArr.loc = { "type:": 'Point', coordinates: loc };
                duplicateArr.transactions = i.transactions;
                const duplicates = await duplicateArr.save();
              }
            }


            let checkRest = await Restaurant.findOne({
              yelp_id: i.id,
            });
            if (checkRest) {
              return false; // skip
            } else {
              let restaurantArr = new Restaurant();
              restaurantArr.yelp_id = i.id;
              restaurantArr.name = i.name;
              restaurantArr.alias = i.alias;
              restaurantArr.image_url = i.image_url;
              restaurantArr.is_closed = i.is_closed;
              restaurantArr.url = i.url;
              restaurantArr.review_count = i.review_count;
              restaurantArr.categories = categoryArray;
              restaurantArr.rating = i.rating;
              restaurantArr.price = i.price;
              restaurantArr.location = i.location;
              restaurantArr.phone = i.phone;
              restaurantArr.is_active = 1;
              let loc = [];
              loc.push(i.coordinates.longitude);
              loc.push(i.coordinates.latitude);
              restaurantArr.loc = { "type:": 'Point', coordinates: loc };
              restaurantArr.transactions = i.transactions;
              const contents = await restaurantArr.save();

              //Save category name in category table here

            }
          }));

        } else {

        }

        // 2. Fetch all restaurant and send them in Json.
        let limit = 20;

        let userCoordinates = [longitude, latitude];

        const factor = 0.621371;
        const miles = radius * factor;

        var milesToRadian = function (miles) {
          var earthRadiusInMiles = 3959;
          return miles / earthRadiusInMiles;
        };

        // get list of favorite restaurants
        let resData = await FavoriteRestaurant.find({ userId: userid });

        // get category from like dislike table
        // make n array
        let  start = new Date();
        start.setHours(0, 0, 0, 0);

        let  end = new Date();
        end.setHours(23, 59, 59, 999);

        let dislikeArr = [];
        let dislikedCategories = await LikeDislike.find({ userId: userid, dislike: true, created: {$gte: start, $lt: end} });
        dislikedCategories.forEach((item) => {
          if (item.categoryId == undefined) {
            return false
          } else {
            dislikeArr = dislikeArr.concat(item.categoryId)
          }
        });

        // query to find available restaurants within these coordinates
        let restaurArr = await Restaurant.find({
          "loc.coordinates": {
            $geoWithin: {
              $centerSphere: [userCoordinates, milesToRadian(miles)]
            }
          }, "categories": { $nin: dislikeArr },"isDeleted": false, "is_active": true
        })
          .sort({ 'created': -1 });

        let otherThanDislikeCategories = [];

        // Loop through the response and compare with favorite restaurant array
        restaurArr.map(async (item) => {
          let isFound = resData.filter((elems) => elems.restaurantId.toString() == item._id.toString())
          item.is_favorite = isFound.length > 0 ? 1 : 0
          otherThanDislikeCategories = otherThanDislikeCategories.concat(item.categories)
          let lon1 = item.loc.coordinates[0];
          let lat1 = item.loc.coordinates[1];
          let lat2 = req.query.latitude;
          let lon2 = req.query.longitude;

          let distance = calcCrow(lat1, lon1, lat2, lon2);

          //console.log(lat1+'--'+lon1+'--'+lat2+'--'+lon2);
          //console.log("################################");
          //console.log(distance);

          const factor = 0.621371
          const miles = distance * factor
          item.distance = miles;
          //console.log("==================================");
          //console.log(item.distance);
          //let res = await Restaurant.findOneAndUpdate({ _id: item._id }, { distance: miles });
          if (item.isDeleted == true) {
            item.isDeleted = false;
            item.is_active = true;
          }
        });

        //console.log("+++++++++++++++++++++++++");
        //console.log(restaurArr);
        restaurArr.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        let nameCategory = await Categories.find({ _id: { $in: otherThanDislikeCategories } }, { _id: 1, name: 1 });
        //console.log(nameCategory);


        return res.success({
          categories: nameCategory,
          list: restaurArr,
          showPop:showPop
        }, req.__('RESTAURANT_FETCHED'))

      });
    } catch (err) {
      s
      return next(err)
    }
  }

  // async list(req, res, next) {
  //   try {
  //     let radius;
  //     let userid = req.user._id;
  //     let user = await User.findOne({ _id: userid }).select('radius');
  //     let userRadius = user.radius;

  //     // Get radius from adminSettings table
  //     let defaultRadius;
  //     let data = await Setting.find({ notification_setting: 1 }).select('radius');
  //     data.forEach((item) => {
  //       defaultRadius = item.radius
  //     });
  //     if (userRadius !== 0) {
  //       radius = userRadius * 1609.344;
  //     } else {
  //       radius = defaultRadius * 1609.344;
  //     }

  //     radius = parseInt(radius);
  //     if(radius > 40000) {
  //       radius = 40000;
  //     }
  //     console.log(radius);

  //     let latitude = req.query.latitude;
  //     let longitude = req.query.longitude;

  //     user.deviceToken = req.query.deviceToken;
  //     user.deviceType = req.query.deviceType;
  //     await user.save();

  //     let radiusforFetch = 1000;
  //     let limit = 50;
  //     let offset = 0;
  //     var options = {
  //       'method': 'GET',
  //       'url': `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}&offset=${offset}`,
  //       'headers': {
  //         'Authorization': 'Bearer ****'
  //       }
  //     };


  //     request(options, async function (error, response) {
  //       if (error) throw new Error(error);

  //       let arr = [];
  //       // console.log(response.body);
  //       let items = JSON.parse(response.body);
  //       // console.log(items.businesses.length)

  //       arr = arr.concat(items.businesses);
  //       // console.log(arr.length);

  //       let totalCount = items.total;
  //       let limit = 50;

  //       let loopCount = parseInt(totalCount / limit);
  //       // console.log(loopCount);
  //       let offset = 0;


  //       const apiCall = () => {
  //         return new Promise((resolve, reject) => {
  //           var option = {
  //             'method': 'GET',
  //             'url': `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}&offset=${offset}`,
  //             'headers': {
  //               'Authorization': 'Bearer ****'
  //             }
  //           };

  //           request.get(options, function (error, res, body) {
  //             if (error) reject(error);
  //             // console.log(body);
  //             resolve(body);
  //           });
  //         });
  //       };


  //       for (let i = 1; i < loopCount; i++) {
  //         offset = offset + 50;

  //         apiCall().then(async (body) => {
  //           // do your things here
  //           // console.log(body);
  //           let item = JSON.parse(body);
  //           arr = arr.concat(item.businesses);
  //           console.log(arr);

  //           let categoryName = [];
  //           arr.map((i) => {
  //             let title = i.categories;
  //             title.forEach((elem) => {
  //               if (categoryName.indexOf(elem.title) == -1)
  //                 categoryName.push(elem.title)
  //             });

  //           })

  //           // save in category table the fetched categories
  //           categoryName.forEach(async (category) => {
  //             let checkCategory = await Categories.findOne({ name: category });
  //             if (checkCategory !== null) {
  //               return false
  //             } else {
  //               let addCategory = await Categories.insertMany({ name: category });
  //             }
  //           });

  //           await Promise.all(arr.map(async (i) => {
  //             // Fetch categories out of saved categories and then save ids in restaurant table
  //             // make an array of filtered elements
  //             let categoryArray = [];
  //             let categoryId = await Categories.find();
  //             categoryId.map((item) => {
  //               let title = i.categories;
  //               let isFound = title.filter((elems) => elems.title.toString() == item.name.toString())
  //               if (isFound.length > 0) {
  //                 categoryArray = categoryArray.concat(item._id)
  //               } else {
  //                 return false; // skip
  //               }
  //             });


  //             let duplicateRest = await Restaurant.findOne({
  //               url: i.url, yelp_id: { $exists: false }
  //             });
  //             if (duplicateRest) {
  //               let checkInDup = await DupRestaurant.findone({
  //                 yelp_id: i.id
  //               });
  //               if (checkInDup) {
  //                 return false //skip
  //               } else {
  //                 let duplicateArr = new DupRestaurant();
  //                 duplicateArr.yelp_id = i.id;
  //                 duplicateArr.name = i.name;
  //                 duplicateArr.alias = i.alias;
  //                 duplicateArr.image_url = i.image_url;
  //                 duplicateArr.is_closed = i.is_closed;
  //                 duplicateArr.url = i.url;
  //                 duplicateArr.review_count = i.review_count;
  //                 duplicateArr.categories = categoryArray;
  //                 duplicateArr.rating = i.rating;
  //                 duplicateArr.price = i.price;
  //                 duplicateArr.location = i.location;
  //                 duplicateArr.phone = i.phone;
  //                 duplicateArr.is_active = 1;
  //                 let loc = [];
  //                 loc.push(i.coordinates.longitude);
  //                 loc.push(i.coordinates.latitude);
  //                 duplicateArr.loc = { "type:": 'Point', coordinates: loc };
  //                 duplicateArr.transactions = i.transactions;
  //                 const duplicates = await duplicateArr.save();
  //               }
  //             }


  //             let checkRest = await Restaurant.findOne({
  //               yelp_id: i.id,
  //             });
  //             if (checkRest) {
  //               return false; // skip
  //             } else {
  //               let restaurantArr = new Restaurant();
  //               restaurantArr.yelp_id = i.id;
  //               restaurantArr.name = i.name;
  //               restaurantArr.alias = i.alias;
  //               restaurantArr.image_url = i.image_url;
  //               restaurantArr.is_closed = i.is_closed;
  //               restaurantArr.url = i.url;
  //               restaurantArr.review_count = i.review_count;
  //               restaurantArr.categories = categoryArray;
  //               restaurantArr.rating = i.rating;
  //               restaurantArr.price = i.price;
  //               restaurantArr.location = i.location;
  //               restaurantArr.phone = i.phone;
  //               restaurantArr.is_active = 1;
  //               let loc = [];
  //               loc.push(i.coordinates.longitude);
  //               loc.push(i.coordinates.latitude);
  //               restaurantArr.loc = { "type:": 'Point', coordinates: loc };
  //               restaurantArr.transactions = i.transactions;
  //               const contents = await restaurantArr.save();
  //             }
  //           }));
  //           console.log("before",arr.length);
  //           console.log("===========================");
  //           arr = [];
  //           console.log("after",arr.length);
  //         });
  //       }
  //       let userCoordinates = [longitude, latitude];

  //       const factor = 0.621371;
  //       const miles = radius * factor;

  //       var milesToRadian = function (miles) {
  //         var earthRadiusInMiles = 3959;
  //         return miles / earthRadiusInMiles;
  //       };

  //       // get list of favorite restaurants
  //       let resData = await FavoriteRestaurant.find({ userId: userid });

  //       // get category from like dislike table
  //       // make n array
  //       let start = new Date();
  //       start.setHours(0, 0, 0, 0);

  //       let end = new Date();
  //       end.setHours(23, 59, 59, 999);

  //       let dislikeArr = [];
  //       let dislikedCategories = await LikeDislike.find({ userId: userid, dislike: true, created: { $gte: start, $lt: end } });
  //       dislikedCategories.forEach((item) => {
  //         if (item.categoryId == undefined) {
  //           return false
  //         } else {
  //           dislikeArr = dislikeArr.concat(item.categoryId)
  //         }
  //       });

  //       // query to find available restaurants within these coordinates
  //       let restaurArr = await Restaurant.find({
  //         "loc.coordinates": {
  //           $geoWithin: {
  //             $centerSphere: [userCoordinates, milesToRadian(miles)]
  //           }
  //         }, "categories": { $nin: dislikeArr }, "isDeleted": false, "is_active": true
  //       }).sort({ 'created': -1 });


  //       let otherThanDislikeCategories = [];

  //       // Loop through the response and compare with favorite restaurant array
  //       restaurArr.map(async (item) => {
  //         let isFound = resData.filter((elems) => elems.restaurantId.toString() == item._id.toString())
  //         item.is_favorite = isFound.length > 0 ? 1 : 0
  //         otherThanDislikeCategories = otherThanDislikeCategories.concat(item.categories)
  //         let lon1 = item.loc.coordinates[0];
  //         let lat1 = item.loc.coordinates[1];
  //         let lat2 = req.query.latitude;
  //         let lon2 = req.query.longitude;

  //         let distance = calcCrow(lat1, lon1, lat2, lon2);

  //         //console.log(lat1+'--'+lon1+'--'+lat2+'--'+lon2);
  //         //console.log("################################");
  //         //console.log(distance);

  //         const factor = 0.621371
  //         const miles = distance * factor
  //         item.distance = miles;
  //         //console.log("==================================");
  //         //console.log(item.distance);
  //         //let res = await Restaurant.findOneAndUpdate({ _id: item._id }, { distance: miles });
  //         if (item.isDeleted == true) {
  //           item.isDeleted = false;
  //           item.is_active = true;
  //         }
  //       });

  //       //console.log("+++++++++++++++++++++++++");
  //       //console.log(restaurArr);
  //       restaurArr.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  //       let nameCategory = await Categories.find({ _id: { $in: otherThanDislikeCategories } }, { _id: 1, name: 1 });
  //       //console.log(nameCategory);


  //       return res.success({
  //         categories: nameCategory,
  //         list: restaurArr
  //       }, req.__('RESTAURANT_FETCHED'))

  //     });
  //   } catch (err) {
  //     return next(err)
  //   }
  // }

  async list(req, res, next) {
    try {
      let radius;
      let userid = req.user._id;
      let user = await User.findOne({ _id: userid }).select('radius');
      let userRadius = user.radius;

      if (userRadius !== 0) {
        radius = userRadius;
      } else {
        // Get radius from adminSettings table
        let defaultRadius;
        let data = await Setting.find({ notification_setting: 1 }).select('radius');
        data.forEach((item) => {
          defaultRadius = item.radius
        });
        radius = defaultRadius;
      }
      radius = 600;


      let latitude = req.query.latitude;
      let longitude = req.query.longitude;

      // latitude = latitude.toFixed(3);
      // longitude = longitude.toFixed(3);

      user.deviceToken = req.query.deviceToken;
      user.deviceType = req.query.deviceType;
      await user.save();


      let logYelp = await Logyelp.findOne({ lat: latitude, long: longitude });

      if (!logYelp) {

        let limit = 5;
        let offset = 0;
        var options = {
          'method': 'GET',
          'url': `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}&offset=${offset}`,
          'headers': {
            'Authorization': 'Bearer ****'
          }
        };


        request(options, async function (error, response) {
          if (error) throw new Error(error);

          var arr = [];

          let items = JSON.parse(response.body);


          arr = arr.concat(items.businesses);


          let totalCount = items.total;
          let limit = 5;

          let loopCount = totalCount / limit;
          let offset = 0;

          const apiCall = (limit,offset) => {
            return new Promise((resolve, reject) => {
              var options = {
                'method': 'GET',
                'url': `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}&offset=${offset}`,
                'headers': {
                  'Authorization': 'Bearer *****x'
                }
              };
          
              request.get(options, function (error, res, body) {
                if (error) reject(error);
                resolve(body);
              });
            });
          };

          console.log('loopCount',loopCount);

          let looplength = Array.from(Array(parseInt(loopCount) + 1).keys());

          console.log('looplength', looplength);


          looplength.forEach(async function (index) {

            
            offset = offset + limit;
            console.log('iii====================',index);
            apiCall(limit,offset).then(async (body) => {
              console.log('i====================',index);
              // do your things here
              let item = JSON.parse(body);
              arr = arr.concat(item.businesses);

              let categoryName = [];
              arr.map((i) => {
                let title = i.categories;
                title.forEach((elem) => {
                  if (categoryName.indexOf(elem.title) == -1)
                    categoryName.push(elem.title)
                });

              })


              // save in category table the fetched categories
              categoryName.forEach(async (category) => {
                let checkCategory = await Categories.findOne({ name: category });
                if (checkCategory !== null) {
                  return false
                } else {
                  let addCategory = await Categories.insertMany({ name: category });
                }
              });

              await Promise.all(arr.map(async (i) => {
                // Fetch categories out of saved categories and then save ids in restaurant table
                // make an array of filtered elements
                let categoryArray = [];
                let categoryId = await Categories.find();
                categoryId.map((item) => {
                  let title = i.categories;
                  let isFound = title.filter((elems) => elems.title.toString() == item.name.toString())
                  if (isFound.length > 0) {
                    categoryArray = categoryArray.concat(item._id)
                  } else {
                    return false; // skip
                  }
                });


                let duplicateRest = await Restaurant.findOne({
                  url: i.url, yelp_id: { $exists: false }
                });
                if (duplicateRest) {
                  let checkInDup = await DupRestaurant.findone({
                    yelp_id: i.id
                  });
                  if (checkInDup) {
                    //return false //skip
                  } else {
                    let duplicateArr = new DupRestaurant();
                    duplicateArr.yelp_id = i.id;
                    duplicateArr.name = i.name;
                    duplicateArr.alias = i.alias;
                    duplicateArr.image_url = i.image_url;
                    duplicateArr.is_closed = i.is_closed;
                    duplicateArr.url = i.url;
                    duplicateArr.review_count = i.review_count;
                    duplicateArr.categories = categoryArray;
                    duplicateArr.rating = i.rating;
                    duplicateArr.price = i.price;
                    duplicateArr.location = i.location;
                    duplicateArr.phone = i.phone;
                    duplicateArr.is_active = 1;
                    let loc = [];
                    loc.push(i.coordinates.longitude);
                    loc.push(i.coordinates.latitude);
                    duplicateArr.loc = { "type:": 'Point', coordinates: loc };
                    duplicateArr.transactions = i.transactions;
                    const duplicates = await duplicateArr.save();
                  }
                }


                let checkRest = await Restaurant.findOne({
                  yelp_id: i.id
                });

                console.log('checkRest--',i.id);
                if (checkRest) {
                  console.log('index',index);
                  console.log('checkRest',i.id);
                  //return false; // skip
                } else {
                  let restaurantArr = new Restaurant();
                  restaurantArr.yelp_id = i.id;
                  restaurantArr.name = i.name;
                  restaurantArr.alias = i.alias;
                  restaurantArr.image_url = i.image_url;
                  restaurantArr.is_closed = i.is_closed;
                  restaurantArr.url = i.url;
                  restaurantArr.review_count = i.review_count;
                  restaurantArr.categories = categoryArray;
                  restaurantArr.rating = i.rating;
                  restaurantArr.price = i.price;
                  restaurantArr.location = i.location;
                  restaurantArr.phone = i.phone;
                  restaurantArr.is_active = 1;
                  let loc = [];
                  loc.push(i.coordinates.longitude);
                  loc.push(i.coordinates.latitude);
                  restaurantArr.loc = { "type:": 'Point', coordinates: loc };
                  restaurantArr.transactions = i.transactions;
                  const contents = await restaurantArr.save();
                }
              }));
              arr = [];
            });

          });
          console.log('test====================');

          let userCoordinates = [longitude, latitude];

          const factor = 0.621371;
          const miles = radius * factor;

          var milesToRadian = function (miles) {
            var earthRadiusInMiles = 3959;
            return miles / earthRadiusInMiles;
          };

          // get list of favorite restaurants
          let resData = await FavoriteRestaurant.find({ userId: userid });

          // get category from like dislike table
          // make n array
          let start = new Date();
          start.setHours(0, 0, 0, 0);

          let end = new Date();
          end.setHours(23, 59, 59, 999);

          let dislikeArr = [];
          let dislikedCategories = await LikeDislike.find({ userId: userid, dislike: true, created: { $gte: start, $lt: end } });
          dislikedCategories.forEach((item) => {
            if (item.categoryId == undefined) {
              return false
            } else {
              dislikeArr = dislikeArr.concat(item.categoryId)
            }
          });

          // query to find available restaurants within these coordinates
          let restaurArr = await Restaurant.find({
            "loc.coordinates": {
              $geoWithin: {
                $centerSphere: [userCoordinates, milesToRadian(miles)]
              }
            }, "categories": { $nin: dislikeArr }, "isDeleted": false, "is_active": true
          }).sort({ 'created': -1 }).limit(300);

          

          let otherThanDislikeCategories = [];

          // Loop through the response and compare with favorite restaurant array
          restaurArr.map(async (item) => {
            let isFound = resData.filter((elems) => elems.restaurantId.toString() == item._id.toString())
            item.is_favorite = isFound.length > 0 ? 1 : 0
            otherThanDislikeCategories = otherThanDislikeCategories.concat(item.categories)
            let lon1 = item.loc.coordinates[0];
            let lat1 = item.loc.coordinates[1];
            let lat2 = req.query.latitude;
            let lon2 = req.query.longitude;

            let distance = calcCrow(lat1, lon1, lat2, lon2);

            const factor = 0.621371
            const miles = distance * factor
            item.distance = miles;

            //let res = await Restaurant.findOneAndUpdate({ _id: item._id }, { distance: miles });
            if (item.isDeleted == true) {
              item.isDeleted = false;
              item.is_active = true;
            }
          });

          restaurArr.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

          let nameCategory = await Categories.find({ _id: { $in: otherThanDislikeCategories } }, { _id: 1, name: 1 });

          var logyelp = new Logyelp();

          let loc1 = [];
          loc1.push(req.query.longitude);
          loc1.push(req.query.latitude);

          logyelp.loc = { "type:": 'Point', coordinates: loc1 };
          logyelp.lat = latitude;
          logyelp.long = longitude;
          logyelp.radius = radius

          await logyelp.save();

          return res.success({
            categories: nameCategory,
            list: restaurArr
          }, req.__('RESTAURANT_FETCHED'));

        });
      } else {
        let userCoordinates = [longitude, latitude];

        const factor = 0.621371;
        const miles = radius * factor;

        var milesToRadian = function (miles) {
          var earthRadiusInMiles = 3959;
          return miles / earthRadiusInMiles;
        };

        // get list of favorite restaurants
        let resData = await FavoriteRestaurant.find({ userId: userid });

        // get category from like dislike table
        // make n array
        let start = new Date();
        start.setHours(0, 0, 0, 0);

        let end = new Date();
        end.setHours(23, 59, 59, 999);

        let dislikeArr = [];
        let dislikedCategories = await LikeDislike.find({ userId: userid, dislike: true, created: { $gte: start, $lt: end } });
        dislikedCategories.forEach((item) => {
          if (item.categoryId == undefined) {
            return false
          } else {
            dislikeArr = dislikeArr.concat(item.categoryId)
          }
        });

        // query to find available restaurants within these coordinates
        let restaurArr = await Restaurant.find({
          "loc.coordinates": {
            $geoWithin: {
              $centerSphere: [userCoordinates, milesToRadian(miles)]
            }
          }, "categories": { $nin: dislikeArr }, "isDeleted": false, "is_active": true
        }).sort({ 'created': -1 }).limit(300);


        let otherThanDislikeCategories = [];

        // Loop through the response and compare with favorite restaurant array
        restaurArr.map(async (item) => {
          let isFound = resData.filter((elems) => elems.restaurantId.toString() == item._id.toString());
          item.is_favorite = isFound.length > 0 ? 1 : 0;
         
          otherThanDislikeCategories = otherThanDislikeCategories.concat(item.categories);
          let lon1 = item.loc.coordinates[0];
          let lat1 = item.loc.coordinates[1];
          let lat2 = req.query.latitude;
          let lon2 = req.query.longitude;

          let distance = calcCrow(lat1, lon1, lat2, lon2);

          const factor = 0.621371
          const miles = distance * factor
          item.distance = miles;

          //let res = await Restaurant.findOneAndUpdate({ _id: item._id }, { distance: miles });
          if (item.isDeleted == true) {
            item.isDeleted = false;
            item.is_active = true;
          }
        });

        restaurArr.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        let nameCategory = await Categories.find({ _id: { $in: otherThanDislikeCategories } }, { _id: 1, name: 1 });

        return res.success({
          categories: nameCategory,
          list: restaurArr
        }, req.__('RESTAURANT_FETCHED'));
      }


    } catch (err) {
      return next(err)
    }
  }

  async starrating(req, res, next) {
    let {
      restaurantId, starrating, comment, reviewgiven, image
    } = req.body;
    try {
        console.log(req.files);
        const upload = multer({ dest: 'uploads/' }).array('image');
          upload(req, res, async (err) => {
            if (err) {
              return res.status(400).send("Something went wrong!");
            }

            //console.log(req.body);
            let restRes = await Restaurant.findOne({ _id: req.body.restaurantId });

            if (req.body.reviewgiven == "no") {

              let getToken = await User.findOne({ _id: req.user._id });
              //const fcmToken = getToken.deviceToken;
              const registrationToken = getToken.deviceToken;
              console.log("===========================================================");
              console.log(registrationToken);
              //const registrationToken = 'c7898989';
              if((getToken.isNotification == true) && (getToken.deviceToken)) {
                  
                console.log("Inside if");
                // Send push notification
                  var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                    to: registrationToken,
                    
                    notification: {
                        title: `Give reviews to ${restRes.name}`, 
                        body: `Share your experience by submitting your reviews to ${restRes.name}` 
                    },
                    
                    data: {  //you can send only notification or only data(or include both)
                        _id: req.body.restaurantId,
                        screen: 'detail'
                    }
                };

                //Save notification in DB
                let saveNotification = new AdminNotification();
                saveNotification.recieverId = req.user._id,
                saveNotification.description = message.notification.body,
                saveNotification.notification_title = message.notification.title
                await saveNotification.save();
                
                fcm.send(message, function(err, response){
                    if (err) {
                        console.log("Something has gone wrong!");
                        return res.warn('', "Error in Sending push notification")
                        console.log(err);
                    } else {
                        //console.log("Successfully sent with response: ", response);
                        return res.success({
                          "language": req.headers['accept-language'],
                        }, "Notifications has been sent successfully!");
                    }
                });
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

              } else {
                return res.success({
                  "language": req.headers['accept-language'],
                  "data" : ""
                });
              }

              

              // end
            } else {

              let userid = req.user._id;

              let check = await Rating.findOne({ restaurantId: req.body.restaurantId, userId: req.user._id })
              if (check) {
                return res.warn('', "Rating already given")
              } else {
                
                const files = req.files;
  
              //console.log(files);
  
              let imageUrlArr = [];
              let imageLocationArr = [];
  
              for (var i = 0; i < files.length; i++) {
                console.log(files[i]);
                let image = await uploadImageAPI(files[i], 'reviews');
                console.log(image.Location);
                //imageUrlArr.push(image.key);
                imageLocationArr.push(image.Location);
              }
              let data = new Rating();
              data.userId = userid;
              data.restaurantId = req.body.restaurantId;
              data.starrating = req.body.starrating;
              data.comment = req.body.comment;
              data.image = imageLocationArr;
  
              data = await data.save();
              const dataJson = data.toJSON();

              //Fetch reviews from DB for this restaurant
              let ratingRes = await Rating.find({ restaurantId: req.body.restaurantId });

              let existingReviewCount = restRes.review_count;
              let existingRating = restRes.rating;
              let yelpReview;

              if((existingReviewCount) && (existingReviewCount != null)) {
                  yelpReview = existingReviewCount*existingRating;
              }else {
                  yelpReview = 0;
              }
              let count = ratingRes.length;
              let dindinRating=0;
              if(ratingRes.length > 0) {
                ratingRes.forEach((item)=>{
                  dindinRating = dindinRating + item.starrating;
                })
              }

              let finalAvrgRating = (yelpReview+dindinRating) / (existingReviewCount+count);

              //console.log(dindinRating);
              //console.log(finalAvrgRating);
              
              if(typeof finalAvrgRating == 'undefined') {
                finalAvrgRating = 0;
              }
  
              if (data) {
                let registrationToken = [];
                let usersToken = await Rating.find({ restaurantId: req.body.restaurantId }).populate('userId');
                //console.log(usersToken);
                usersToken.forEach((item) => {
                  console.log(item);
                  if((item.userId.isNotification == true) && (item.userId._id != req.user._id)) {
                      registrationToken = registrationToken.concat(item.userId.deviceToken);
                  }
                });
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                console.log(registrationToken);
                const registrationTokens = registrationToken

                   // Send push notification
                var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                  registration_ids: registrationTokens,
                  notification: {
                      title: `Someone gave reviews to ${restRes.name}, check that now`, 
                      body: `Check the reviews given by someone to the restaurant ${restRes.name} you visited earlier` 
                  },
                  
                  data: {  //you can send only notification or only data(or include both)
                      _id: req.body.restaurantId,
                      averageRating:finalAvrgRating.toFixed(2),
                      restaurant_name:restRes.name,
                      screen: 'review'
                  }
                };

                usersToken.forEach(async (item) => {
                  let saveNotification = new AdminNotification();
                  saveNotification.recieverId = item.userId._id,
                  saveNotification.description = message.notification.body,
                  saveNotification.notification_title = message.notification.title
                  await saveNotification.save();
                });

                fcm.send(message, function(err, response){
                    if (err) {
                      console.log("Something has gone wrong!");
                      return res.success({
                        "language": req.headers['accept-language'],
                        data:data,
                      }, "Review has been submitted successfully!");
                  } else {
                      console.log("Successfully sent with response: ", response);
                      return res.success({
                        "language": req.headers['accept-language'],
                        data:data,
                      }, "Review has been submitted successfully!");
                  }
                });

                console.log("*****************************************************************");
 
              } else {
                return res.warn('', "Error sending Message")
              }

              }
              

           }
           
          });
        
      
    } catch (err) {
      return next(err);
    }
  }

  async getNotification(req, res, next) {
    try{
      let notification = await AdminNotification.find({});
      notification.forEach((item)=>{
        moment.utc(item.created).toDate();
      });

      return res.success({
        notification: notification,
      }, req.__("All notifications fetched successfully"));

    } catch (err) {
      return next(err)
    }
  }

  async createLike(req, res, next) {
    let {
      categoryId, dislike, like
    } = req.body;

    let userLike = await User.findOne({ _id: req.user._id });
    let userLikeCount = userLike.likeCount;
    //console.log(userLikeCount);

    let userid = req.user._id;
    let likedis = new LikeDislike();
    likedis.userId = userid;
    likedis.categoryId = req.body.categoryId;
    likedis.like = req.body.like;
    likedis.dislike = req.body.dislike;

    likedis = await likedis.save();
    const likedisJson = likedis.toJSON();

    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    let count = await LikeDislike.find({userId: req.user._id, like:true, created: { $gte: start, $lt: end }}).sort({_id:-1}).limit(userLikeCount);
    //console.log(count);
    let limitCount = count.length
    //console.log(limitCount);
  
    return res.success({
      "language": req.headers['accept-language'],
      likedis: likedisJson, limitCount:userLikeCount, likeCount:limitCount
    }, req.__("ADDED_LEAD"));
  }

    
    async visitrestaurant(req, res, next) {
      let {
        restaurantId
      } = req.body;      
      let userId = req.user._id;

      try {

        let checkuserIdExists = await VisitRestaurant.findOne({
          userId
        });
        //console.log(checkuserIdExists);

        if (checkuserIdExists && checkuserIdExists.userId) {
          return res.success({
              userId: checkuserIdExists.userId,
          }, req.__("You have already visited this restaurant"));
      }else {
        let x = await VisitRestaurant.findOne({ userId })
        if (!x) {
      let visitdata = new VisitRestaurant();
      visitdata.userId = userId;
      visitdata.restaurantId= req.body.restaurantId,  
      visitdata= await visitdata.save();
      const visitdataJson = visitdata.toJSON();
                    return res.success({
                        "language": req.headers['accept-language'],
                        visitdata: visitdataJson,
                    }, req.__("ADDED_LEAD"));
                  } else {
                    return res.warn('', req.__('USER_NO_EXISTS'));
                }
                  }        
                } catch (err) {
                  return next(err)
                }

    }


    async FavoriteRes(req, res, next) {
      let {
        restaurantId
      } = req.body;
      let userId = req.user._id;
      let value = req.query;
      let dislikeFlag = value.value;
      let objectRest = objectId.createObjectId(restaurantId)
      try {
        if (dislikeFlag == 0) {
          let checkRes = await FavoriteRestaurant.findOne({
            restaurantId:restaurantId ,userId:userId
          });
          if (checkRes) {
            return res.warn('', "You marked this restaurant as favorite");
          } else {
            let favRas = new FavoriteRestaurant();
            favRas.userId = userId;
            favRas.restaurantId = req.body.restaurantId;
            favRas = await favRas.save();
            const favRasJson = favRas.toJSON();
            return res.success({
              "language": req.headers['accept-language'],
              favRas: favRasJson,
            }, req.__("ADDED_LEAD"));
  
          }
        } else {
          let dislike = await FavoriteRestaurant.deleteOne({ restaurantId:objectRest, userId:userId})
          console.log(dislike);
          return res.success('', "This restaurant is marked as unfavourite");
        }
  
      } catch (err) {
        return next(err)
      }
    }

    async favList(req, res, next) {
      const { user } = req;
      try {
        let userId = req.user._id;
  
        let favRes = await FavoriteRestaurant.find({ userId: userId });
        if (favRes) {
          let favRestaurArr = await Restaurant.find({"isDeleted": false, "is_active": true});
          let favArr = [];
          favRes.forEach((elems) => {
            let isFound = favRestaurArr.filter((item) => item._id.toString() == elems.restaurantId.toString());
            
            isFound.forEach((restaurent) => {
              favArr = favArr.concat(restaurent);
              restaurent.is_favorite = true
            })
          });

          favArr.forEach((item) => {
            let lon1 = item.loc.coordinates[0];
            let lat1 = item.loc.coordinates[1]; 
            let lat2 = req.query.latitude;
            let lon2 = req.query.longitude;
  
            let distance = calcCrow(lat1, lon1, lat2, lon2);
            const factor = 0.621371
            const miles = distance * factor
            item.distance = miles;
          });

          return res.success({ favArr }, req.__("FAVORITE_RESTAURANT"));
        } else {
          return res.warn('', "No favorite restaurant found")
        }
      } catch (err) {
        return next(err)
      }
    }

    async getRestDetails(req, res, next) {
      const { user } = req;
  
      let restaurantId = objectId.createObjectId(req.query.restaurantId);
      try {
        let userId = req.user._id;
        let array = [];
  
        // Get ratings from yelp and calculate stars
        const yelpRating = await Restaurant.findOne({ _id: restaurantId });
        const reviewCount = yelpRating.review_count;
        const rating = yelpRating.rating;
        const yelpId = yelpRating.yelp_id;
        let lat1 = yelpRating.loc.coordinates[1];
        let lon1 = yelpRating.loc.coordinates[0];
        
        // Adding More Images of the restaurant
        var options = {
          'method': 'GET',
          'url': `https://api.yelp.com/v3/businesses/${yelpId}`,
          'headers': {
            'Authorization': 'Bearer ******x'
          }
        };       
        
        console.log(options);
        async.waterfall([
          function(callback) {  
            rp(options, async function (error, response) {
              //if (error) throw new Error(error);
              let item = JSON.parse(response.body);
              let rest = await Restaurant.findOne({_id : restaurantId});
              if(!rest.additional_image_url || rest.additional_image_url == 0){
                let updateRest = await Restaurant.findOneAndUpdate({_id : restaurantId}, {additional_image_url: item.photos},{new:true});
              }
              callback(error,1);
            });

          },
          function(arg1,callback) {
            (async () => {
              const starCount = parseInt(reviewCount) * rating;
              array.push(starCount);
        
              // Get ratings from the user restaurant and store ratings in an array 
              let number = await Rating.find({ restaurantId: restaurantId });
              number.forEach((elem) => {
                array = array.concat(elem.starrating);
              });
        
              // Calculate avarage rating 
              var sum = 0;
              for (var i = 0; i < array.length; i++) {
                sum += array[i];
              }
              var average = sum / ((array.length + reviewCount) - 1);
              var averageRating = parseFloat(average.toFixed(2))
      
              let lat2 = req.query.latitude;
              let lon2 = req.query.longitude;
  
              let distance = calcCrow(lat1, lon1, lat2, lon2);
              const factor = 0.621371
              const miles = distance * factor
              
              const details = await Restaurant.aggregate([
                {
                  $match: { _id: restaurantId },
                },
                {
                  $lookup: {
                    "from": "visitrestaurants",
        
                    let: { foreignId: "$_id" },
                    "as": "visited",
                    pipeline: [
                      {
                        $match:
                        {
                          $expr:
                          {
                            $and:
                              [
                                { $eq: ["$$foreignId", "$restaurantId"] },
                                { $eq: ["$userId", userId] }
        
                              ]
                          }
                        }
                      },
                      { $project: { goinghere: 1, userId: 1, restaurantId: 1, _id: 0, iamhere: 1 } }
                    ]
                  }
                },
                
              ]);
              
              let resData = await FavoriteRestaurant.find({ userId: req.user._id });
        
              details.map((item) => {
                let isFound = resData.filter((elems) => elems.restaurantId.toString() == item._id.toString())
                item.is_favorite = isFound.length > 0 ? true : false
                item.distance = miles;
              });
              
              let categoryNames = [];
              details.forEach((elem) => {
                categoryNames = categoryNames.concat(elem.categories)
              });
        
              let nameCategory = await Categories.find({ _id: { $in: categoryNames } }, { _id: 1, name: 1 });
      
              let foodTypes = ["favorites","breakfast", "lunch", "dinner", "dessert"];
              let foodDetails = await Food.aggregate([
                // First Stage
                {
                  $match: { "food_type": { $in: foodTypes }, "restaurantId": restaurantId }
                },
                // Second Stage
                {
                  $group: {
                    _id: "$food_type",
                    foodItems: { $push: "$$ROOT" }
                  }
                }
              ]);
              callback(null,{details, averageRating, miles, nameCategory, foodDetails});
            })().catch(err => {
                callback(err,1);
            });
            
          }
        ], function(err, results) {
        if(!err) {
          return res.success(results, req.__('RESTAURANT_DETAILS'));
        }else {
          return next(err);
        }
          
      });
      
      } catch (err) {
        console.log(err);
        return next(err)
      }
    }

    async goingHere(req, res, next) {
      let {
        restaurantId, goinghere, iamhere, yelp_id
      } = req.body;
  
      try {
        let userId = req.user._id;
  
        let check = await VisitRestaurant.findOne({ userId: userId, restaurantId: restaurantId });
        if (!check) {
          let data = new VisitRestaurant();
  
          data.userId = userId;
          data.restaurantId = req.body.restaurantId;
          data.yelp_id = req.body.yelp_id
          data.goinghere = req.body.goinghere;
          data.iamhere = req.body.iamhere;
  
          data = await data.save();
          const dataJson = data.toJSON();
          return res.success({
            "language": req.headers['accept-language'],
            data: dataJson,
          }, req.__('You are going to this restaurant'));
  
        } else {
          let data = await VisitRestaurant.findByIdAndUpdate({ _id: check._id }, { iamhere: true }, {new:true});
          return res.success({ data }, "You are at this restaurant")
        }
      } catch (err) {
        return next(err)
      }
    }

    async goingHereHistory(req, res, next) {
      const { user } = req;
      try {
        let userId = req.user._id;

        let goRestHistory = await VisitRestaurant.find({ userId: userId, goinghere: true, iamhere:false });

        //console.log(goRestHistory);

        if (goRestHistory.length > 0) {
          let restaurant = await Restaurant.find();
          let toGoRestaurant = [];

          goRestHistory.forEach((item) => {
            let filteredRes = restaurant.filter((elems) => elems._id.toString() == item.restaurantId.toString())
            if (filteredRes.length > 0) {
              filteredRes.forEach((restaurant) => {
                toGoRestaurant = toGoRestaurant.concat(restaurant);
              })
            }
          });

          toGoRestaurant.forEach((item) => {
            let lon1 = item.loc.coordinates[0];
            let lat1 = item.loc.coordinates[1]; 
            let lat2 = req.query.latitude;
            let lon2 = req.query.longitude;
  
            let distance = calcCrow(lat1, lon1, lat2, lon2);
            const factor = 0.621371
            const miles = distance * factor
            console.log(miles);
            item.distance = miles;
          });

          return res.success({ toGoRestaurant }, "Restaurant details fetched");
        } else {
          return res.warn('', "No Restaurent details")
        }
      } catch (err) {
        return next(err)
      }
  }

  async filterRes(req, res, next) {
    const { user } = req;
    let { miles, latitude, longitude } = req.query
    try {
      const category = req.body.categoryId;
      if (typeof category == 'undefined' || category == '') {
        return res.warn('', req.__('Select_Category'));
      }
      else if (category == 1) {
        var milesToRadian = function (miles) {
          var earthRadiusInMiles = 3959;
          return miles / earthRadiusInMiles;
        };

        let userCoordinates = [longitude, latitude];

        let restaurantCate = await Restaurant.find({
          "loc.coordinates": {
            $geoWithin: {
              $centerSphere: [userCoordinates, milesToRadian(miles)]
            },
            "isDeleted": false, "is_active": true
          }
        }).sort({ 'rating': -1 });

        restaurantCate.forEach((item) => {
          let lon1 = item.loc.coordinates[0];
          let lat1 = item.loc.coordinates[1]; 
          let lat2 = req.query.latitude;
          let lon2 = req.query.longitude;

          let distance = calcCrow(lat1, lon1, lat2, lon2);
          const factor = 0.621371
          const miles = distance * factor
          item.distance = miles;
        });


        return res.success({ restaurantCate }, "Successfully fetched top rated restaurants")
      }
      else {

        let categoryObject = [];
        category.forEach((item) => {
          let idObject = objectId.createObjectId(item)
          categoryObject = categoryObject.concat(idObject);
        });

        let categoryfetch = await Categories.find({ _id: { $in: categoryObject } });

        var milesToRadian = function (miles) {
          var earthRadiusInMiles = 3959;
          return miles / earthRadiusInMiles;
        };

        let userCoordinates = [longitude, latitude];

        let restaurantCate = await Restaurant.find({
          "loc.coordinates": {
            $geoWithin: {
              $centerSphere: [userCoordinates, milesToRadian(miles)]
            }
          }, "categories": { $in: categoryObject },"isDeleted": false, "is_active": true
        });

        restaurantCate.forEach((item) => {
          let lon1 = item.loc.coordinates[0];
          let lat1 = item.loc.coordinates[1]; 
          let lat2 = req.query.latitude;
          let lon2 = req.query.longitude;

          let distance = calcCrow(lat1, lon1, lat2, lon2);
          const factor = 0.621371
          const miles = distance * factor
          item.distance = miles;
        });

        restaurantCate.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        if (categoryfetch.length > 0 || restaurantCate.length > 0) {
          return res.success({
            categoryfetch,
            restaurantCate
          }, req.__("FILTERED_RESTAURANTS"))
        } else {
          return res.warn('', req.__("NOT_FOUND"))
        }
      }
    } catch (err) {
      return next(err)
    }
  }

  async iAmHereHistory(req, res, next) {
    const { user } = req;
    try {
      let userId = req.user._id;

      let iAmHereHistory = await VisitRestaurant.find({ userId: userId, iamhere: true });

      console.log(iAmHereHistory);

      if (iAmHereHistory.length > 0) {
        let restaurants = await Restaurant.find();
        let visitedRestaurant = [];

        iAmHereHistory.forEach((item) => {
          let filteredRes = restaurants.filter((elems) => elems._id.toString() == item.restaurantId.toString())
          if (filteredRes.length > 0) {
            filteredRes.forEach((restaurant) => {
              visitedRestaurant = visitedRestaurant.concat(restaurant);
            })
          }
        });

        visitedRestaurant.forEach((item) => {
          let lon1 = item.loc.coordinates[0];
          let lat1 = item.loc.coordinates[1]; 
          let lat2 = req.query.latitude;
          let lon2 = req.query.longitude;

          let distance = calcCrow(lat1, lon1, lat2, lon2);
          const factor = 0.621371
          const miles = distance * factor
          console.log(miles);
          item.distance = miles;
        });

        return res.success({ visitedRestaurant }, "Restaurant details fetched");
      } else {
        return res.warn('', "Not visited any retaurant")
      }
    } catch (err) {
      return next(err)
    }
  }

  async getReviews(req, res, next) {
    let {
      restaurantId
    } = req.query;

    let objectRest = objectId.createObjectId(restaurantId)
    let timeObject = [];
    try {
      let reviews = await Rating.find({ restaurantId: restaurantId }).populate('userId', `avatar firstname lastname _id email`);
      // Added check for firstname and lastname
      for (var i = 0; i < reviews.length; i++) {
          moment.utc(reviews[i].created).toDate();
        //console.log(reviews[i].userId.firstname);
        if (!reviews[i].userId.firstname && !reviews[i].userId.lastname) {
          reviews[i].userId.firstname = 'Dindin';
          reviews[i].userId.lastname = 'User';
        }
      }
      
      return res.success({reviews},'Successfully fetched the review submitted by users')
    } catch (err) {
      return next(err)
    }
  }

  async getGroupCategory(req, res, next) {
    const { user } = req;
    try {

      let groupedItems = await Food.aggregate([{
        $group: { _id: "$categoryId", foodItems: { $push: "$$ROOT" } }
      }]);

      //console.log(groupedItems);

      res.success({ groupedItems }, 'Successfully get grouped categories')

    } catch (err) {
      res.next(err);
    }
  }

  async searchCategory(req, res, next) {
    const { user } = req;
    const searchFilter = req.query.search;
    //console.log(searchFilter);
    try {

      if (searchFilter == 'undefined' && searchFilter == '') {
        return res.warn("", 'Please enter query');
      } else {
      let list = [];
      let uniqueRestaurant = [];
      let restList = await Restaurant.find({"isDeleted": false, "is_active": true});

      let foodItems = await Food.find({ food_name: {'$regex' : searchFilter, '$options' : 'i'} });
        foodItems.forEach(async (item) => {
          if(item.restaurantId.isDeleted == true){
            let res = await Restaurant.findOneAndUpdate({ _id:item.restaurantId._id},{isDeleted:false});
          }
        });
        
        foodItems.map((item) => {
          let foodRest = restList.filter((elem) => elem._id.toString() == item.restaurantId.toString());
          if (foodRest.length > 0 && uniqueRestaurant.indexOf(foodRest[0]._id) == -1){
            uniqueRestaurant.push(foodRest[0]._id)
            list = list.concat(foodRest);
          }
        })

        if (list.length > 0) {
          list.forEach((item) => {
            let lon1 = item.loc.coordinates[0];
            let lat1 = item.loc.coordinates[1]; 
            let lat2 = req.query.latitude;
            let lon2 = req.query.longitude;

            let distance = calcCrow(lat1, lon1, lat2, lon2);
            const factor = 0.621371
            const miles = distance * factor
            console.log(miles);
            item.distance = miles;
          });
        }

        if (list.length > 0) {
          return res.success(
            { list : list },
            "Successfully got the restaurant associated with this item")
        } else {
          return res.warn('', 'No restaurants found for this food item')
        }
      }
    } catch (err) {
      res.next(err);
    }
  }

}

module.exports = new RestaurantController();

function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return Value * Math.PI / 180;
}

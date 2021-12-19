const express = require('express');
const router = express.Router();
const RestaurantController = require('./RestaurantController');

const { validate } = require('../../util/validations');
const validations = require('./RestaurantValidations');
const {verifyToken} = require('../../util/auth');

const {
    models: { Restaurant, Rating  },
} = require('../../../../lib/models');


router.get('/list', verifyToken,
    RestaurantController.list
);

router.post('/rating', verifyToken,
    RestaurantController.starrating
);

router.post('/like', verifyToken,
    RestaurantController.createLike
);

router.post('/visitrest', verifyToken,
    RestaurantController.visitrestaurant
);

router.post('/FavoriteRes', verifyToken,
    RestaurantController.FavoriteRes
);

router.post('/going', verifyToken,
    RestaurantController.goingHere
);

router.get('/details', verifyToken,
    RestaurantController.getRestDetails
);

router.get('/favList', verifyToken,
    RestaurantController.favList
);

router.get('/goingHereHistory', verifyToken,
    RestaurantController.goingHereHistory
);

router.get('/iAmHereHistory', verifyToken,
    RestaurantController.iAmHereHistory
);

router.post('/filterRes', verifyToken,
    RestaurantController.filterRes
);

router.get('/getReviews', verifyToken,
    RestaurantController.getReviews
);

router.get('/getGroupCategories', verifyToken,
    RestaurantController.getGroupCategory
);

router.get('/search', 
    verifyToken,
    RestaurantController.searchCategory
);

router.get('/notification', 
    verifyToken,
    RestaurantController.getNotification
);


module.exports = router;

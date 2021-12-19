const express = require('express');
const router = express.Router();
const RatingController = require('./RatingController');
const { verifyToken } = require('../../util/auth');
const validations = require('./RatingValidations');
const { validate } = require('../../util/validations');

router.get('/', verifyToken, RatingController.listPage);
// router.get('/', verifyToken, RatingController.RestaurantlistPage);
router.get('/list', verifyToken, RatingController.list);
// router.get('/resturantratinglist', verifyToken, RatingController.RestaurantStarlist);
router.get('/delete/:id',
    validate(validations.requireId, 'params', {}, '/ratings'),
    RatingController.delete
);
router.get('/update-status', verifyToken, RatingController.updateStatus);
router.get('/delete-restore/:id',
    verifyToken, 
    RatingController.deleteRestore
);

router.get('/view/:id',  
    RatingController.view
);
module.exports = router;
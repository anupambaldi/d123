const express = require('express');
const router = express.Router();
const RestaurantController = require('./RestaurantController');
const { verifyToken } = require('../../util/auth');
const validations = require('./RestaurantValidations');
const { validate } = require('../../util/validations');

router.get('/',
    verifyToken,
    RestaurantController.listPage
);

router.get('/list',
    verifyToken,
    RestaurantController.list
);

router.get('/add',
    verifyToken,
    RestaurantController.addPage
);

router.post('/add',
    verifyToken,
    //validate(validations.add),
    RestaurantController.add
);

router.get('/update-status',
    verifyToken,
    validate(validations.updateStatus, 'query', {}, '/restaurants'),
    RestaurantController.updateStatus
);

router.get(
    '/view/:_id',
    verifyToken,
    RestaurantController.view
);

router.get(
    '/edit/:_id',
    verifyToken,
    //validate(validations.requireSlug, 'params', {}, '/stores'),
    RestaurantController.editPage
);

router.post(
    '/edit/:_id',
    verifyToken,
    //validate(validations.edit),
    RestaurantController.edit
);

router.get('/delete/:id',
    verifyToken,
    validate(validations.requireId, 'params', {}, '/restaurants'),
    RestaurantController.delete
);

router.post(
    '/add_food/:id',
    verifyToken,
    RestaurantController.add_food
);
router.get(
    '/add_food_page/:id',
    verifyToken,
    RestaurantController.add_food_page
);

router.get(
    '/food_list/:id',
    verifyToken,
    RestaurantController.food_list
);

router.get(
    '/food_edit_page/:id',
    verifyToken,
    
    RestaurantController.food_edit_page
);
router.post(
    '/food_edit/:id',
    verifyToken,
    
    RestaurantController.food_edit    
);
router.get(
    '/food_delete/:id',
    verifyToken,
    RestaurantController.food_delete    
); 

router.get('/delete-restore/:id',
    verifyToken,
    RestaurantController.deleteRestore
);

router.get('/duplicate-list-page',
    verifyToken,
    RestaurantController.duplicateListPage
);

router.get('/duplicate-list',
    verifyToken,
    RestaurantController.duplicateList
);

router.get('/duplicate-reject/:id',
    verifyToken,
    RestaurantController.duplicateReject
);


router.get(
    '/duplicate-view/:_id',
    verifyToken,
    RestaurantController.duplicateView
);

router.get(
    '/duplicate-accept/:id',
    verifyToken,
    RestaurantController.duplicateAccept
);

router.post(
    '/validate-url',   
    RestaurantController.isUrlExists
);

router.post(
    '/validate-edituser',
    RestaurantController.isEditUserExists
);

module.exports = router;



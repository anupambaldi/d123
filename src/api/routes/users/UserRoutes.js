const express = require('express');
const router = express.Router();
const UserController = require('./UserController');
const { validate } = require('../../util/validations');
const validations = require('./UserValidations');
const { verifyToken } = require('../../util/auth');

router.get('/dashboard',
    verifyToken,
   // validate(validations.requireId, 'query'),
    UserController.dashboard
);
router.post('/upload-profile',
    verifyToken,
   // validate(validations.requireId, 'query'),
    UserController.uploadProfile
);
router.put('/password',
    verifyToken,
    //validate(validations.updatePassword),
    UserController.updatePassword
);


/*router.post("/edit-profile",
    verifyToken,
    //validate( validations.edit-profile ),
    UserController.editProfile
)*/

router.post("/add-address",
    verifyToken,
    //validate( validations.edit-profile ),
    UserController.addAddress
)
router.post("/delete-address",
    verifyToken,
    //validate( validations.edit-profile ),
    UserController.deleteAddress
)

router.get(
    "/profile_account_info",
    verifyToken,
    UserController.profileAccountInfo
)

router.get(
    "/profile-update-address",
    verifyToken,
    UserController.profileUpdateAddress
)

router.post(
    "/product-list",
    verifyToken,
    UserController.productList
)
router.get(
    "/subcat-and-vendor-list",
    verifyToken,
    UserController.subCatAndVendorList
)


router.get(
    "/address-names",
    verifyToken,
    UserController.addressName
)
router.get(
    "/search-vendor",
    verifyToken,
    UserController.vendorSearch
);
router.get(
    "/my-practices",
    verifyToken,
    UserController.myPractices
)
router.post(
    "/associate-practice",
    verifyToken,
    UserController.associatePractice
)

router.post(
    "/update-language",
    verifyToken,
    UserController.updateLanguage
)
router.post(
    '/add_leads',
    UserController.add_leads
)
router.post(
    '/invite_leads',
    UserController.invite_leads
)

router.post(
    "/contact-change-request",
    verifyToken,
    UserController.contactChangeRequest
)

router.post(
    "/contact-change-otp-verify",
    verifyToken,
    UserController.contactChangeOtpVerify
)

router.post(
    "/contact-us",
    verifyToken,
    UserController.contactUs
)

router.post('/changepassword',
    verifyToken,
    UserController.updatePassword
);

router.post('/updateProfile',
    verifyToken,
    UserController.updateProfile
);

router.post('/set',
    verifyToken,
    UserController.setLikeCount
);

router.get('/category',
    verifyToken,
    UserController.fetchCategories
);

router.post('/setRadius', verifyToken,
    UserController.setRadius
);

router.post('/notification',
    verifyToken,
    UserController.notification
);

router.post('/skip',
    verifyToken,
    UserController.stepSkip
);

router.get('/knowlike',
    verifyToken,
    UserController.knowlike
);

module.exports = router;

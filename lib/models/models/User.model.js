const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const UserSchema = new Schema(
    {
        role:{
            type: String,
            default:'user'    //admin, user
        },
        firstname: {
            type: String,
            //required: true,
            trim: true
        },
        lastname: {
            type: String,
            //required: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
        },
        temp_password: {
            type: String,
            trim: true,
            default: null
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            //required: true,
        },
        mobile: {
            type: String,
            //required: true,
        },
        radius: {
            type: String,
            trim: true
        },
        predetermine: {
            type: String,
            trim: true
        },
        avatar: {
            type: String,
            trim: true,
            default:''
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        isSuspended: {
            type: Boolean,
            default: true
        },
        deviceToken: {
            type: String,
            trim: true
        },
        token:{
            type: Number,
            default:0
        },
        deviceType: {
            type: String,
            trim: true
        },
        emailVerify:{
            type: Boolean,
            default:false
        },
        location: [{ 
            type: String,
            default:false
        }],
        deviceId: [{ 
            type: String,
        }],
        otp:{
            type: String,
            default:""
        },
        likeCount:{
            type:Number,
            default:0
        },
        radius:{
            type:Number,
            default:0
        },
        isNotification: {
            type: Boolean,
            default: false
        },
        skipTwoStep: {
            type: Boolean,
            default: true
        },

        authTokenIssuedAt: Number,
        emailToken:{
            type:String,default:''
        },
        resetToken: {//for forgot password
            type: String,
            default:""
        },
        isSuspended: {
            type: Boolean,
            default: false
        },
        social_type: {
            type: String,
            default:""
        },
        social_id: {
            type: String,
            default:""
        },
        email_manual: {
            type: Boolean,
            default: false
        },
        like_time: {
            type: String
        }

    },
    {
        timestamps: {
            createdAt: 'created',
            updatedAt: 'updated'
        },
        id: false,
        toJSON: {
            getters: true
        },
        toObject: {
            getters: true
        },
    }
);

UserSchema.pre('save', async function(next) {
    const user = this;

    if (!user.isModified('password')) return next();
    try {
        const saltRounds = parseInt(process.env.BCRYPT_ITERATIONS, 10) || 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
        next();
    } catch (e) {
        next(e);
    }
});

UserSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (e) {
        return false;
    }
};

module.exports = mongoose.model('User', UserSchema);
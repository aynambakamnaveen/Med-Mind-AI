import express from 'express'
import {register,login,getme, logout} from '../controllers/usercontrol.js'
import protect from '../middleware/auth.js'
const  userRouter = express.Router();

userRouter.post('/login',login)
userRouter.post('/register',register)
userRouter.post('/logout',logout)
userRouter.get('/data',protect,getme)

export default userRouter;
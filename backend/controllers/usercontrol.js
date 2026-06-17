import User from '../model/User.model.js';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Fill all fields'
    });
  }

  try {
    const isUser = await User.findOne({ email });

    if (isUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(201).json({
      success: true,
      message: 'Account created',
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email or Password is not entered'
    });
  }

  try {
    const isUser = await User.findOne({ email });

    if (!isUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const checkpass = await bcrypt.compare(password, isUser.password);

    if (!checkpass) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const token = jwt.sign(
      { id: isUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      message: 'Account logged in',
      token,
      user: {
        name: isUser.name,
        email: isUser.email
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const getme = async (req,res)=>{
    try{
        const user = req.user
        return res.json({success:true, user})
    }catch(error){
        return res.json({success: false, message: error.message})
    }
}
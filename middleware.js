let jwt = require("jsonwebtoken");
const config = require("./config");
 const User = require("./model/user")

let checkToken = (req, res, next) => {
  
  let token = req.headers["x-access-token"] || req.headers["authorization"]; 
  console.log("token" , token);
  if (token && token.slice(0, 7) == "Bearer ") {
    token = token.slice(7, token.length);
    console.log("token" , token);
  }

  if (token) {
      jwt.verify(token, config.secret_key, async(err, decoded) => {
        console.log("secret" , config.secret_key)
      if (err) {
         console.log("err" , err)
        return res.status(401).json({
          success: false,
          message: "Token is not valid",
        });
      } else {
        // req.decoded = decoded;
        let user = await User.findById(decoded._id);
        if(user && user.deleted){
          return res.status(410).json({
            success: false,
            message: "User has been deleted",
          });      
        }
        req.decoded = user;
        next();
      }
    });
  } else {
    console.log("not token");
    return res.status(400).json({
      success: false,
      message: "Auth token is not supplied",
    });
  }
};

module.exports = {
  checkToken: checkToken,
};

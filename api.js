const express =  require('express')
const { v4: uuidv4 } = require('uuid');
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const items = require('./services/items');
const users = require('./services/users');

app.use(bodyParser.json());


app.get('/', (req, res) => 
{
  return res.status(200).json({
    "message": "This is an online marketplace!"
  });
})

//optional, functions used in the development process

/*
//method used to get all items
app.get('/items', (req, res) => 
{
    const t = items.getAllItems();
    return res.status(200).json({
      "message": "Ok"
    });
})

//optional
//method used to get an item by id
app.get('/items/:itemId', (req, res) => 
{
  //make the link 
  const itemId = req.params.itemId;
  //get a response
  const t = items.getItem(itemId);
  if (t !== undefined)
  {
    //send ok status
    //return the item data with the specific itemId
    res.json(t);
    return res.status(200).json({
      "message": "Ok"
    });
  }
  else
  {
    //not found
    return res.status(404).json({
      "message": "Not found"
    });
  }
})    

//optional stuff
app.get('/users/:id', (req, res) => 
{
    //res.send('You requested id ' + req.params.id);

    const results = users.find(u => u.id == req.params.id);
    
    if(results !== undefined)
    {
        res.json(results);
        return res.status(200).json({
          "message": "Ok"
        });
    }
    else
    {
      return res.status(404).json({
        "message": "Not found"
      });
    }
})
*/

//-----------------------------------------------------------------------------------------------------
//----------------------------------AUTHENTICATION STARTS HERE-------------------------------------------
//-----------------------------------------------------------------------------------------------------

/*********************************************
 * HTTP Basic Authentication
 * Passport module used
 * http://www.passportjs.org/packages/passport-http/
 ********************************************/
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
  function(username, password, done) 
  {

    const user = users.getUserByName(username);
    if(user == undefined) 
    {
      // Username not found
      console.log("HTTP Basic username not found");
      return done(null, false, { message: "HTTP Basic username not found" });
    }

    /* Verify password match */
    if(bcrypt.compareSync(password, user.password) == false) 
    {
      // Password does not match
      console.log("HTTP Basic password not matching username");
      return done(null, false, { message: "HTTP Basic password not found" });
    }
    return done(null, user);
  }
));

app.get('/httpBasicProtectedResource',
        passport.authenticate('basic', { session: false }),
        (req, res) => 
{
  res.json({ yourProtectedResource: "profit" });
});

//method used to register a new user with the HTTP basic 
app.post('/registerBasic',
        (req, res) => 
{
  if(!req.body.username) 
  {
    return res.status(400).json({status: "Missing username from body"});
  }
  if(!req.body.password) 
  {
    return res.status(400).json({status: "Missing password from body"});
  }
  if(!req.body.email) 
  {
    return res.status(400).json({status: "Missing email from body"});
  }

  //hash the password
  const hashedPassword = bcrypt.hashSync(req.body.password, 6);
  console.log(hashedPassword);
  //add the user to the users array with the introduced credentials
  users.addUser(req.body.username, hashedPassword, req.body.name, req.body.birthDate, req.body.email, req.body.address);

  //send the created status
  return res.status(201).json({
    "message": "Created."
})
});

/*********************************************
 * JWT authentication
 * Passport module is used, see documentation
 * http://www.passportjs.org/packages/passport-jwt/
 ********************************************/
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy,
      ExtractJwt = require('passport-jwt').ExtractJwt;
const jwtSecretKey = require('./jwt-key.json');

let options = {}

/* Configure the passport-jwt module to expect JWT
   in headers from Authorization field as Bearer token */
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

/* This is the secret signing key.
   You should NEVER store it in code  */
options.secretOrKey = jwtSecretKey.secret;

passport.use(new JwtStrategy(options, function(jwt_payload, done) 
{
  console.log("Processing JWT payload for token content:");
  console.log(jwt_payload);


  /* Here you could do some processing based on the JWT payload.
  For example check if the key is still valid based on expires property.
  */
  const now = Date.now() / 1000;
  if(jwt_payload.exp > now) 
  {
    done(null, jwt_payload.user);
  }
  else 
  {// expired
    done(null, false);
  }
}));

app.get(
  '/jwtProtectedResource',
  passport.authenticate('jwt', { session: false }),
  (req, res) => 
  {
    console.log("jwt");
    res.json(
      {
        status: "Successfully accessed protected resource with JWT",
        user: req.user
      }
    );
  }
);

//log in 
app.post(
  '/loginForJWT',
  passport.authenticate('basic', { session: false }),
  (req, res) => 
  {
    const body = {
      id: req.user.id,
      email : req.user.email
    };

    const payload = 
    {
      user : body
    };

    const options = 
    {
      expiresIn: '1d'
    }

    const token = jwt.sign(payload, jwtSecretKey.secret, options);

    return res.status(200).json({ token });
})


//-----------------------------------------------------------------------------------------------------
//----------------------------------AUTHENTICATION ENDS HERE-------------------------------------------
//-----------------------------------------------------------------------------------------------------


//method only for logged in users
//returns all items posted by a specific user identified by userId
//optional - a logged in user should be able to view his/her postings
//not in documentation
app.get('/itemsJWT', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => 
  {
    console.log('GET /itemsJWT')
    //search for specific item(s) based on userId
    const t = items.getAllUserItems(req.user.id);
    if(t !== undefined)
    {
      //displaying the item(s) found for the specific userId introduced
      res.json(t);
      //send status ok
      return res.status(200).json({
        "message": "Ok"
      });
    }
    else
    {
      //no items found for that specific userId
      return res.status(404).json({
        "message": "Not found"
      });
    }
})

//method only for logged in users
//create a new item as a logged in user
app.post('/itemsJWT', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => 
  {
    console.log('POST /itemsJWT');
    console.log(req.body);
    //if all required fields are introduced then we can create a new item
    if((req.body.title) && (req.body.description) && (req.body.category) && (req.body.location) && (req.body.images) && (eq.body.price) && (req.body.deliveryType) && (req.body.sellerInfo)) 
    {
      //posting date assumed as current date in the format yyyy-mm-dd
      let today = new Date().toISOString().slice(0, 10)
      //insert the new item in the items array
      items.insertItem(req.body.title, req.body.description, req.body.category, req.body.location, req.body.images, req.body.price, today, req.body.deliveryType, req.body.sellerInfo, req.user.id);
      //display all items added by this user
      //res.json(items.getAllUserItems(req.user.id));
      return res.status(201).json({
        "message": "Created."
      })
    }
    else 
    {
      //bad request otherwise
      return res.status(400).json({
        "message": "Bad request"
      });
    }  
})

//method only for logged in users
//modify an item found by id
app.put('/itemsJWT/:itemId', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => 
{
  const itemId = req.params.itemId;
  const t = items.getItem(itemId);
  
  const results1 = items.getItem(req.params.itemId);

    if(results1.userId !== req.user.id)
    {
      //user unauthorized
      return res.status(401).json({
        "message": "Unauthorized"
      });
    }
    if(t !== undefined)
    {
      for (const key in req.body)
      {
        t[key] = req.body[key];
      } 
      //return all items the user wants to sell
      res.json(items.getAllUserItems(req.user.id));

      return res.status(200).json({
        "message": "Ok"
      });
    }
    else
    {
      //send not found
      return res.status(404).json({
        "message": "Not found"
      });
    }
    
})

//method only for logged in users
//delete an item based on userId
app.delete('/itemsJWT/:itemId', 
            passport.authenticate('jwt', { session: false }), 
            (req, res) => 
{
    //request itemId and search for the item index
    const results = items.getItemIndex(req.params.itemId);
    //get the item to be deleted body 
    const results1 = items.getItem(req.params.itemId);

    if(results1.userId !== req.user.id)
    {
      //user unauthorized
      return res.status(401).json({
        "message": "Unauthorized"
      });

    }
    //if it's found
    if(results !== -1)
    {
        //call the splice
        items.deleteItem(results);
        //send ok status
        return res.status(200).json({
          "message": "Ok"
        });
    }
    else
    {
        //item id not found
        return res.status(404).json({
          "message": "Not found"
        });
    }
}) 

//method used to get an item by category
app.get('/items/searchByCategory/:category', (req, res) => 
{
  //make the link 
  const category = req.params.category;
  //get a response
  const t = items.getItemsCategory(category);
  if (t !== undefined)
  {
    //send ok status
    //return the item(s) data within the specific category
    res.json(t);
    return res.status(200).json({
      "message": "Ok"
    });
  }
  else
  {
    //not found
    return res.status(404).json({
      "message": "Not found"
    });
  }
})

//method used to get an item by location
app.get('/items/searchByLocation/:city/:country', (req, res) => 
{
  //make the link 
  const city = req.params.city;
  const country = req.params.country;
  //get a response
  const t = items.getItemsLocation(city, country);
  if (t !== undefined)
  {
    //return the item(s) data with the specific location
    res.json(t);
    //send ok status
    return res.status(200).json({
      "message": "Ok"
    });
  }
  else
  {
    //not found
    return res.status(404).json({
      "message": "Not found"
    });
  }
})

//method used to get an item by postingDate
app.get('/items/searchByPostingDate/:postingDate', (req, res) => 
{
  //make the link 
  const postingDate = req.params.postingDate;
  //get a response
  const t = items.getItemsPostingDate(postingDate);
  if (t !== undefined)
  {
    //return the item(s) data with the specific postingDate
    res.json(t);
    //send ok status
    return res.status(200).json({
      "message": "Ok"
    });
  }
  else
  {
    //not found
    return res.status(404).json({
      "message": "Not found"
    });
  }
})

/*
app.listen(port, () =>
{
    console.log('Marketplace app listening at http://localhost:$(port)');
})
*/

let apiInstance = null;
exports.start = () => {apiInstance = app.listen(port, () => 
  {
    console.log('Marketplace app listening at http://localhost:$(port)');
  })}

exports.stop = () =>
{
    apiInstance.close();
}
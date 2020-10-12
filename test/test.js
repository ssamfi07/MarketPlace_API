const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../api');

const expect = chai.expect;
const apiAddress = 'http://localhost:3000';

describe('Item operations', function() 
{

    before(function() 
    {
      server.start();
    });
  
    after(function() 
    {
      server.stop();
    })
    
    var token = NULL;

    describe('Get items', function() 
    {
      it('Should respond with an array of items', async function() 
      {
        await chai.request(apiAddress)
          .get('/items')
          .then(response => 
          {
            expect(response.status).to.equal(200);
            expect(response.body).to.be.a('object');
            expect(response.body).to.have.a.property('items');
            expect(response.body.items).to.be.a('array');
            expect(response.body.items[0]).to.be.a('object');
            expect(response.body.items[0]).to.have.a.property('id');
            expect(response.body.items[0]).to.have.a.property('title');
            expect(response.body.items[0]).to.have.a.property('description');
            expect(response.body.items[0]).to.have.a.property('category');
            expect(response.body.items[0]).to.have.a.property('price');
            expect(response.body.items[0]).to.have.a.property('location');
            expect(response.body.items[0].location).to.be.a('object');
            expect(response.body.items[0]).location.to.have.a.property('city');
            expect(response.body.items[0]).location.to.have.a.property('country');
            expect(response.body.items[0]).to.have.a.property('deliveryType');
            expect(response.body.items[0].deliveryType).to.be.a('object');
            expect(response.body.items[0].deliveryType).to.have.a.property('shipping');
            expect(response.body.items[0].deliveryType).to.have.a.property('pickup');
            expect(response.body.items[0]).to.have.a.property('images');
            expect(response.body.items[0].images).to.have.a.property('image0');
            expect(response.body.items[0].images).to.have.a.property('image1');
            expect(response.body.items[0].images).to.have.a.property('image2');
            expect(response.body.items[0].images).to.have.a.property('image3');
            expect(response.body.items[0]).to.have.a.property('sellerInfo');
            expect(response.body.items[0].sellerInfo).to.be.a('object');
            expect(response.body.items[0].sellerInfo).to.have.a.property('name');
            expect(response.body.items[0].sellerInfo).to.have.a.property('email');
            expect(response.body.items[0]).to.have.a.property('userId');
          })
          .catch(error => 
            {
            expect.fail(error)
            })
        })
      })
  
    describe('Add a new item', function() 
    {
      // login for token
      it('Should login if the correct credentials been given', async function () {
        await chai.request(apiAddress)
            .post('/loginJWT')
            .auth("string", "stringpassword")
            .then(response => {
                token = response.body.token;
            })
            .catch(error => {
                expect.fail(error)
            })

      })
      //not logged in
      it('Should NOT add a new item because no bearer token is provided', async function () 
      {
        await chai.request(apiAddress)
            .post('/itemsJWT')
            .send({
              title: "Example title",
              description: "Example description",
              category: "Example category",
              price: "Example price",
              location: {
                city: "Example city",
                country: "Example country"
              },
              deliveryType: {
                shipping: true,
                pickup: false
              },
              images: {
                  image0: "Example image0",
                  image1: "Example image1",
                  image2: "Example image2",
                  image3: "Example image3"
              },
              sellerInfo: {
                  name: "Example name",
                  email: "Example email"
              }
            })
            .then(response => 
              {
                expect(response.status).to.equal(401);
              })
            .catch(error => 
              {
                expect.fail(error)
              })
      })
      it('Should add a new item', async function() 
      {
        await chai.request(apiAddress)
          .post('/itemsJWT')
          .set({
            Authorization: `Bearer ${token}`
          })
          .send({
            title: "Example title",
            description: "Example description",
            category: "Example category",
            price: "Example price",
            location: {
              city: "Example city",
              country: "Example country"
            },
            deliveryType: {
              shipping: true,
              pickup: false
            },
            images: {
                image0: "Example image0",
                image1: "Example image1",
                image2: "Example image2",
                image3: "Example image3"
            },
            sellerInfo: {
                name: "Example name",
                email: "Example email"
            }
          })
          .then(response => 
          {
            expect(response.status).to.equal(201);
            return chai.request(apiAddress).get('/itemsJWT');
          })
          .then(readResponse => 
            {
            expect(readResponse.body.items[readResponse.body.items.length - 1].title).to.equal("Example deviceType");
            expect(readResponse.body.items[readResponse.body.items.length - 1].description).to.equal("Example description");
            expect(readResponse.body.items[readResponse.body.items.length - 1].category).to.equal("Example category");
            expect(readResponse.body.items[readResponse.body.items.length - 1].price).to.equal("Example price");
            expect(readResponse.body.items[readResponse.body.items.length - 1].location.city).to.equal("Example city");
            expect(readResponse.body.items[readResponse.body.items.length - 1].location.country).to.equal("Example country");
            expect(readResponse.body.items[readResponse.body.items.length - 1].deliveryType.shipping).to.equal(true);
            expect(readResponse.body.items[readResponse.body.items.length - 1].deliveryType.pickup).to.equal(false);
            expect(readResponse.body.items[readResponse.body.items.length - 1].images.image0).to.equal("Example image0");
            expect(readResponse.body.items[readResponse.body.items.length - 1].images.image1).to.equal("Example image1");
            expect(readResponse.body.items[readResponse.body.items.length - 1].images.image2).to.equal("Example image2");
            expect(readResponse.body.items[readResponse.body.items.length - 1].images.image3).to.equal("Example image3");
            expect(readResponse.body.items[readResponse.body.items.length - 1].sellerInfo.name).to.equal("Example name");
            expect(readResponse.body.items[readResponse.body.items.length - 1].sellerInfo.email).to.equal("Example email");
            })
          .catch(error => 
            {
            expect.fail(error)
            })
      })
    })

    describe('Should edit an existing item', function () 
    {
      it('Successfully edits an item and return status 200', async function () 
      {
          await chai.request(apiAddress)
              .put('/itemsJWT/54265')
              .set({
                  Authorization: `Bearer ${token}`
                })
              .send({
                title: "Example title",
                description: "Example description",
                category: "Example category",
                price: "Example price",
                location: {
                  city: "Example city",
                  country: "Example country"
                },
                deliveryType: {
                  shipping: true,
                  pickup: false
                },
                images: {
                    image0: "Example image0",
                    image1: "Example image1",
                    image2: "Example image2",
                    image3: "Example image3"
                },
                sellerInfo: {
                    name: "Example name",
                    email: "Example email"
                }
              })
              .then(response => 
                {
                expect(response.status).to.equal(200);
                expect(response.body).to.be.a('object');
                expect(response.body).to.have.a.property('items');
                expect(response.body.items).to.be.a('array');
                expect(response.body.items[0]).to.be.a('object');
                expect(response.body.items[0]).to.have.a.property('id');
                expect(response.body.items[0]).to.have.a.property('title');
                expect(response.body.items[0]).to.have.a.property('description');
                expect(response.body.items[0]).to.have.a.property('category');
                expect(response.body.items[0]).to.have.a.property('price');
                expect(response.body.items[0]).to.have.a.property('location');
                expect(response.body.items[0].location).to.be.a('object');
                expect(response.body.items[0]).location.to.have.a.property('city');
                expect(response.body.items[0]).location.to.have.a.property('country');
                expect(response.body.items[0]).to.have.a.property('deliveryType');
                expect(response.body.items[0].deliveryType).to.be.a('object');
                expect(response.body.items[0].deliveryType).to.have.a.property('shipping');
                expect(response.body.items[0].deliveryType).to.have.a.property('pickup');
                expect(response.body.items[0]).to.have.a.property('images');
                expect(response.body.items[0].images).to.have.a.property('image0');
                expect(response.body.items[0].images).to.have.a.property('image1');
                expect(response.body.items[0].images).to.have.a.property('image2');
                expect(response.body.items[0].images).to.have.a.property('image3');
                expect(response.body.items[0]).to.have.a.property('sellerInfo');
                expect(response.body.items[0].sellerInfo).to.be.a('object');
                expect(response.body.items[0].sellerInfo).to.have.a.property('name');
                expect(response.body.items[0].sellerInfo).to.have.a.property('email');
                expect(response.body.items[0]).to.have.a.property('userId');
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
        })

      it('Should not edit the item because the item with id 54266 is not existing', async function () 
      {
        await chai.request(apiAddress)
            .put('/itemsJWT/54266')
            .set({
                Authorization: `Bearer ${token}`
            })
            .send({
              title: "Example title",
              description: "Example description",
              category: "Example category",
              price: "Example price",
              location: {
                city: "Example city",
                country: "Example country"
              },
              deliveryType: {
                shipping: true,
                pickup: false
              },
              images: {
                  image0: "Example image0",
                  image1: "Example image1",
                  image2: "Example image2",
                  image3: "Example image3"
              },
              sellerInfo: {
                  name: "Example name",
                  email: "Example email"
              }
            })
            .then(response => 
              {
                expect(response.status).to.equal(404);
              })
            .catch(error => 
              {
                expect.fail(error)
              })
      })

      it('Should throw an error because no token is provided', async function () 
      {
          await chai.request(apiAddress)
              .put('/itemsJWT/54265')
              .send({
                title: "Example title",
                description: "Example description",
                category: "Example category",
                price: "Example price",
                location: {
                  city: "Example city",
                  country: "Example country"
                },
                deliveryType: {
                  shipping: true,
                  pickup: false
                },
                images: {
                    image0: "Example image0",
                    image1: "Example image1",
                    image2: "Example image2",
                    image3: "Example image3"
                },
                sellerInfo: {
                    name: "Example name",
                    email: "Example email"
                }
              })
              .then(response => 
                {
                  expect(response.status).to.equal(401);
                  expect(response.body).to.be.instanceof(Object);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
    })

    describe('Delete an item', function () 
    {
      it('Should delete the item', async function () 
      {
          await chai.request(apiAddress)
              .delete('/itemsJWT/54265')
              .set({
                  Authorization: `Bearer ${token}`
              })
              .then(response => 
                {
                  expect(response.status).to.equal(200);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
      it('Should not delete the item because no token provided', async function () 
      {
          await chai.request(apiAddress)
              .delete('/itemsJWT/54265')
              .then(response => {
                  expect(response.status).to.equal(401);
              })
              .catch(error => {
                  expect.fail(error)
              })
      })
      it('Should not delete the item because no item with that id exists', async function () 
      {
          await chai.request(apiAddress)
              .delete('/itemsJWT/54266')
              .set({
                  Authorization: `Bearer ${token}`
              })
              .then(response => 
                {
                  expect(response.status).to.equal(404);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
    })

    describe('Search for items', function () 
    {
      it('Should search for items by category', async function () 
      {
          await chai.request(apiAddress)
              .get('/items/searchByCategory/electronics')
              .then(response => {
                  expect(response.status).to.equal(200);
                  expect(response.body).to.be.instanceof(Array);
              })
              .catch(error => {
                  expect.fail(error)
              })
      })
      it('Should search for items by location', async function () 
      {
          await chai.request(apiAddress)
              .get('/items/searchByLocation/Oulu/Finland')
              .then(response => 
                {
                  expect(response.status).to.equal(200);
                  expect(response.body).to.be.instanceof(Array);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
      it('Should search for items by date', async function () 
      {
          await chai.request(apiAddress)
              .get('/items/searchByPostingDate/2020-03-23')
              .then(response => 
                {
                  expect(response.status).to.equal(200);
                  expect(response.body).to.be.instanceof(Array);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
      it('Should give an error because date format is invalid', async function () 
      {
          await chai.request(apiAddress)
              .get('/items/searchByPostingDate/17062027')
              .then(response => 
                {
                  expect(response.status).to.equal(400);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
    })
});

describe('User operations', function () 
{

  before(function () 
  {
      server.start();
  });

  after(function () 
  {
      server.stop();
  })

  var token = null;

  describe('Register user', function () 
  {
      it('Should add a new user to the database', async function () {
          await chai.request(apiAddress)
              .post('/registerBasic')
              .send({
                username: "string",
                password: "string",
                name: "string",
                birthDate: "2020-10-12",
                email: "user@example.com",
                address: 
                {
                  street: "string",
                  country: "string",
                  postalCode: "string",
                  city: "string"
                }
              })
              .then(response => {
                  expect(response.status).to.equal(201);
              })
              .catch(error => {
                  expect.fail(error)
              })
      })
      it('Should NOT add a new user to the database because the username already exists', async function () 
      {
          await chai.request(apiAddress)
              .post('/registerBasic')
              .send({
                username: "string",
                password: "stringpassword",
                name: "string",
                birthDate: "2020-10-12",
                email: "user@example.com",
                address: 
                {
                  street: "string",
                  country: "string",
                  postalCode: "string",
                  city: "string"
                }
              })
              .then(response => 
                {
                  expect(response.status).to.equal(409);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
      it('Should NOT add a new user to the database because no email was given', async function () 
      {
          await chai.request(apiAddress)
              .post('/registerBasic')
              .send({
                username: "string",
                password: "stringpassword",
                name: "string",
                birthDate: "2020-10-12",
                email: "",
                address: 
                {
                  street: "string",
                  country: "string",
                  postalCode: "string",
                  city: "string"
                }
              })
              .then(response => 
                {
                  expect(response.status).to.equal(400);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
        })
  })

  describe('Login a user', function () 
  {

      it('Should login if the correct credentials been given', async function () {
          await chai.request(apiAddress)
              .post('/loginForJWT')
              .auth("string", "stringpassword")
              .then(response => 
                {
                  expect(response.status).to.equal(200);
                  expect(response.body.token)
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })
      it('Should not login if the wrong credentials been given', async function () 
      {
          await chai.request(apiAddress)
              .post('/loginForJWT')
              .auth("string", "wrongpassword")
              .then(response => 
                {
                  expect(response.status).to.equal(401);
                })
              .catch(error => 
                {
                  expect.fail(error)
                })
      })

      it('Should login if the correct credentials been given', async function () 
      {
          await chai.request(apiAddress)
              .post('/loginForJWT')
              .auth("string", "stringpassword")
              .then(response => 
                {
                  token = response.body.token;
                });
      })
  })
});
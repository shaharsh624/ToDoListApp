  // jshint esversion:6

  const express = require("express"); // Express
  const bodyParser = require("body-parser"); // Body-parser
  const mongoose = require('mongoose'); // Mongoose
  const _ = require("lodash");

  const app = express();

  app.set("view engine", "ejs"); // EJS
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(express.static("public"));

  mongoose.set('strictQuery', false);
  mongoose.connect("mongodb+srv://shaharsh:pavilion@cluster0.wbikdvq.mongodb.net/todolistDB");


  const itemsSchema = {
    name: String
  };
  const Item = mongoose.model("Item", itemsSchema);
  const item1 = new Item({
    name: "Welcome to your todolist!"
  });
  const item2 = new Item({
    name: "Hit the + btn to add a new item."
  });
  const item3 = new Item({
    name: "<-- Hit to delete an item."
  });
  const defaultItems = [item1, item2, item3];




  const listSchema = {
    name: String,
    items: [itemsSchema]
  };
  const List = mongoose.model("List", listSchema);



  app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems) {

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Succesfully saved defult Items in DB!");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newlistItems: foundItems
        });
      }
    });
  });



  app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
      name: customListName
    }, function(err, foundList) {
      if (!err) {
        if (!foundList) {
          // Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          // Show an existing list
          res.render("list", {
            listTitle: foundList.name,
            newlistItems: foundList.items
          });
        }
      }
    });
  });



  app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({
        name: listName
      }, function(err, foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
    }
  });



  app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId, function(err) {
        if (!err) {
          console.log("Succesfully deleted checked item");
          res.redirect("/");
        }
      });
    } else {
      List.findOneAndUpdate({
        name:listName
      }, {
        $pull: {
          items: {
            _id: checkedItemId
          }
        }
      }, function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
        }
      })
    }
  });


  app.listen(3000, function() {
    console.log("Server started with port 3000")
  });

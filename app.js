// Require Modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose= require("mongoose");
const _= require("lodash");
const dotenv= require("dotenv").config();
const app= express();
const port= 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

// Other static files used are placed in the public folder
app.use(express.static("public"));

// Connect to MongoDB
mongoose.connect("mongodb+srv://"+ process.env.MONGODB_KEY +".l5lqa.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser:true, useUnifiedTopology:true})

//Date for default list
var day= new Date();
var options = {
  weekday: "long",
  day: "numeric",
  month: "long",
}
var currentDay= day.toLocaleDateString("en-US", options)

// Schema for item collection
const itemSchema= {
  name: {type: String, required: true},
  status: String,
}
// Item collection
const Item= mongoose.model("Item", itemSchema);

// Schema for custom lists
const customListSchema= {
  name:{type:String, required:true},
  items: [itemSchema]
}
// Custom list collections
const customList= mongoose.model("customlist", customListSchema);


// Get routes

// Home route
app.get("/", function(req, res){

  // Read all documents in Item collection
  Item.find({}, function(err, itemsFound)
  {
    if (err) {
      console.log(err);
    }else
    {
      // Read every document in custom list collection
      customList.find({}, function(err, foundList){
        if(!err){
          if(foundList){
            //Render file
            res.render("to-do-list", {listTitle: currentDay,  newItems: itemsFound, selectedList: foundList});
          }
        }else{
          console.log(err)
        }
      });
    }
  });

});

// Custom List route
app.get("/:customList", function(req, res){
  // Assign route parameter to customListName
  const customListName= _.capitalize(req.params.customList);
  // Check if you can find at least one list with that name
  customList.findOne({name: customListName}, function(err, foundList){
    if(!err){
      //If you found one, read all documents in the customList and render it
      if(foundList){
        customList.find({}, function(err, list){
          if(!err){
            if(foundList){
              // console.log(list);
              res.render("to-do-list", {listTitle: foundList.name,  newItems: foundList.items, selectedList: list});
            }
          }else{
            console.log(err)
          }
        });

      }
    }else{
      console.log(err)
    }
  });
});

// Post routes

// Add new list or choose an existing list
app.post("/customList", function(req, res){
  // Save title of new list
  var customListName= req.body.newlistTitle;

  //If title is undefined save title of existing list selected
  if (customListName == undefined) {
    customListName= _.capitalize(req.body.createdList);
  } else {
    customListName= _.capitalize(customListName);
  }

  // Search for a document with the name of the list title
  customList.findOne({name: customListName}, function(err, foundList){
    if(!err){
      // If one was found, read all documents in the custom list collection and render it
      if(foundList){
        customList.find({}, function(err, list){
          if(!err){
            if(foundList){
              // console.log(list);
              res.render("to-do-list", {listTitle: foundList.name,  newItems: foundList.items, selectedList: list});
            }
          }else{
            console.log(err);
          }
        });
      }
      // Else create a new custom list document and redirect to custom list get route
      else{
        const list= new customList({
          name: customListName,
          items: []
        });

        list.save(function(err, doc){
          if (err) {
            console.log(err);
          } else {
            res.redirect("/"+customListName);
          }
        });
      }
    }else{
      console.log(err);
    }
  });
});

// Post route for adding a new item to a list
app.post("/", function(req, res){

  // Take item name and list title
  const itemName = req.body.addItem;
  const listName = req.body.button;

  // Create new item document
  const item = new Item({
    name: _.capitalize(itemName)
  });

  // If item was created in default list save item and direct to home get route
  if (listName === currentDay){
    item.save();
    res.redirect("/");
  }
  // Otherwise search for a document with the list name save items and redirect to custom list home route
  else {
    customList.findOne({name: listName}, function(err, foundList){
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

// Delete post route
app.post("/delete", function(req, res){
  const checkedItemId = req.body.delete;
  const listName = req.body.listName;

  // Delete from defaut list
  if (listName === currentDay) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        res.redirect("/");
      }else{
        console.log(err);
      }
    });
  }
  // Delete from custom List
  else {
    customList.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }else{
        console.log(err);
      }
    });
  }

});

// Listen route
app.listen(process.env.PORT || port, function(){
  console.log("Server running on port", port);
})

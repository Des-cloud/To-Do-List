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

mongoose.connect("mongodb+srv://"+ process.env.MONGODB_KEY +".l5lqa.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser:true, useUnifiedTopology:true})

var day= new Date();
var options = { 
  weekday: "long",
  day: "numeric",
  month: "long",
}
var currentDay= day.toLocaleDateString("en-US", options)

const itemSchema= {
  name: {type: String, required: true},
  status: String,
}

const Item= mongoose.model("Item", itemSchema);


const customListSchema= {
  name:{type:String, required:true},
  items: [itemSchema]
}

const customList= mongoose.model("customlist", customListSchema);

app.get("/", function(req, res){

  Item.find({}, function(err, itemsFound)
  {
    if (err) {
      console.log(err);
    }else
    {res.render("to-do-list", {listTitle: currentDay, newItems: itemsFound});}
  });

});

app.get("/:customList", function(req, res){
  const customListName= _.capitalize(req.params.customList);

  customList.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(foundList){
        console.log("Exists");
        res.render("to-do-list", {listTitle: foundList.name, newItems: foundList.items});
      }
    }
  });
});

app.post("/customList", function(req, res){
  console.log(req.body.newlistTitle);
  const customListName= _.capitalize(req.body.newlistTitle);

  customList.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(foundList){
        console.log("Exists");
        res.render("to-do-list", {listTitle: foundList.name, newItems: foundList.items});
      }
      else{
        console.log("Does not exist");
        const list= new customList({
          name: customListName,
          items: []
        });

        list.save(function(err, doc){
          if (err) {
            console.log(err);
          } else {
            console.log("Saved successfully");
            console.log(doc);
            res.redirect("/"+customListName);
          }
        });
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.addItem;
  const listName = req.body.button;

  const item = new Item({
    name: _.capitalize(itemName)
  });

  if (listName === currentDay){
    item.save();
    res.redirect("/");
  } else {
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


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === currentDay) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    customList.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }

});


app.listen(process.env.PORT || port, function(){
  console.log("Server running on port", port);
})

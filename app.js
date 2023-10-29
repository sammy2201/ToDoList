//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();
mongoose.connect(process.env.mongoURL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

//schemacreate

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "welcome!",
});
const item2 = new Item({
  name: "Hit + button to add items.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItem = [item1, item2, item3];

const ListsSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});
const List = mongoose.model("List", ListsSchema);

//set n use

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

//get

app.get("/", function (req, res) {
  Item.find(function (err, founditems) {
    if (founditems.length === 0) {
      Item.insertMany(defaultItem, function (err) {
        if (err) {
          console.log("error");
        } else {
          console.log("done");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: founditems,
      });
    }
  });
});

app.get("/:custumListName", function (req, res) {
  const custumListName = _.capitalize(req.params.custumListName);

  List.findOne(
    {
      name: custumListName,
    },
    function (err, foundList) {
      if (!err) {
        if (!foundList) {
          //new items
          const list = new List({
            name: custumListName,
            items: defaultItem,
          });

          list.save();
          res.redirect("/" + custumListName);
        } else {
          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
          });
        }
      }
    }
  );
});

//post

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listname = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listname === "Today") {
    res.redirect("/");
    item.save();
  } else {
    List.findOne(
      {
        name: listname,
      },
      function (err, fountList) {
        fountList.items.push(item);
        fountList.save();
        res.redirect("/" + listname);
      }
    );
  }
});

app.post("/delete", function (req, res) {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedId, function (err) {
      if (!err) {
        console.log("done remove");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      {
        name: listName,
      },
      {
        $pull: {
          items: {
            _id: checkedId,
          },
        },
      },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});

//Requirements
const express = require ('express');
const bodyParser = require ('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

//If you want to run the app on local host replace the string below to 'mongodb://localhost:27017/todolistDB'
//If you want to run using mongoDB atlas replace the '<userNmae>' and '<password>' in the values you entered when you create the username.
mongoose.connect('mongodb+srv://<userName>:<password>@cluster0.br9fghe.mongodb.net/todolistDB'); 


//Creat item schema
const itemSchema = {
    name : String
};

//Creat model using item schema
const Item = mongoose.model('Item', itemSchema);

//Create items
const item1 = new Item ({
    name: 'Welcome to your todolist!'
});

const item2 = new Item ({
    name: 'Hit the + button to add a new item.'
});

const item3 = new Item ({
    name: '<-- Hit this to delete an item.'
});

//Put all the items in default array who will appear in start of every new list/page
const defaultItems = [item1, item2, item3];


////Creat list schema - have field named 'items' who is array of item schema
const listSchema = {
    name: String,
    items: [itemSchema]
};

//Creat model using list schema
const List = mongoose.model("List", listSchema); 


//Get request (to the '/' page) - if we didn't load the default array, load it and redirect to the page.
//Else, render to ejs template the required values.
app.get('/', function (req, res){
    Item.find({}, function(err, result){
        if (result.length === 0){
            Item.insertMany(defaultItems, function(err){
                if (err) {
                    console.log(err);
                } else {
                    console.log('Successfully saved default items to DB.');
                }
            });
            res.redirect('/');
        } else {
            res.render('list',
                {ListTitle: "Today", newListItems : result}
            );
        }
    });
});


//Get request (to a custom page) - if there is any list for this route, create one with the default array and redirect to the page.
//Else, render to ejs template the required values.
app.get('/:customListName', function(req, res){
    const ListName = _.capitalize(req.params.customListName);
    List.findOne({name: ListName}, function(err, foundList){
        if (!err){
            if (!foundList){
                const list = new List({
                    name: ListName,
                    items: defaultItems
                });
                list.save(); 
                res.redirect("/" + ListName);
            } else {
                res.render('list',
                    {ListTitle: foundList.name, newListItems : foundList.items
                });
            }
        }
    });
     
});


//Post request (for adding) - take the current values from the input (in the ejs template), creat new item because we will need it anyway.
//If the list name is 'Today' thats mean we are in the home route so save the item to home route list and redirect,
//Else, that's mean we are in custome route, so find the required list, append the new item, and redirect. 
app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.List;

    const item = new Item ({
        name: itemName
    });

    if (listName === "Today"){
        item.save();
        res.redirect('/');
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
    
});


//Post request (for deleting) - take the current values from the input (in the ejs template), and check:
//If the name of the list is 'Today' thats mean we are in the home route so find and remove the item from the match list and redirect.
//Else, that's mean we are in custome route, so use in the findOneAndUpdate method to find from bunch of lists the list that have this
//Certain _id, delete it and redirect.
app.post('/delete', function(req, res){
    const checkedItemId = req.body.checkbox;
    const deleteFromThisList = req.body.deleteFromThisList;
    if (deleteFromThisList === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                console.log(err);
            }
        });
        res.redirect('/');
    } else {
        List.findOneAndUpdate({name: deleteFromThisList}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if (!err){
                res.redirect('/' + deleteFromThisList);
            }
        });
    }
});


//Setting the port to also run on the external Heroku servers and if there are none,
//then on local host.
let port = process.env.PORT;
if (port == null || port == ""){
    port = 3000;
}

app.listen(port, function (){
    console.log('Server has started successfully.');
});


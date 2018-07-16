// Dependencies
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');

// Global variables
var startingUrl = "http://www.amazon.com/";
var listingPage = "http://www.amazon.com/books";
var url = new URL(listingPage);
var baseUrl = url.protocol + "//" + url.hostname;


// Empty array for saving scraped data
var results = [];

visitStartingUrl(startingUrl, visitListingPage);

function visitStartingUrl(url, callback) {
  console.log("Visting starting page " + url);
  // Make the request
  request(url, function(error, response, body) {
    if(error) {
      console.log("Error: " + error);
    };
    // Check status code (200 = HTTP OK)
    console.log("Status code: " + response.statusCode);
    if(response.statusCode === 200) {
      // Navigate to listing page
      visitListingPage(listingPage, findBookElements);
    };
  });
};


function visitListingPage(url, callback) {
  console.log("Visiting listing page " + url);
  // Make the request
  request(url, function(error, response, body) {
    if(error) {
      console.log("Error: " + error);
    };
    // Check status code (200 = HTTP OK)
    console.log("Status code: " + response.statusCode);
    if(response.statusCode === 200) {
      // Calling function to find book elements on the listing page
      findBookElements(listingPage, visitBookPage)
    };
  });
};


function findBookElements(url, callback) {
  console.log("Finding book elements on page")
  // Make the request
  request(url, function(error, response, body) {
    if(error) {
      console.log("Error: " + error);
    };
    // Check status code (200 = HTTP OK)
    console.log("Status code: " + response.statusCode);
    if(response.statusCode === 200) {
      // Parse document body with Cheerio
      var $ = cheerio.load(body);

      var bookTitles = [];
      var allBookUrls = [];
      var selectedBookUrls = [];
      var selectedBookLinks = [];

      // Finding book elements on the page-- Grabbing all "a" tags with the element: attribs.title
      $("a").each(function(i, element) {
      // console.log(element.attribs.title); // Returns double titles + undefined titles

        // Getting rid of all 'undefined' titles
        if (element.attribs.title) {
          var titles = element.attribs.title;
          // console.log(titles); // ** Returns list of book titles that are SOMETIMES doubled **
          bookTitles.push(titles);

    // Attempt to de-duplicate the sometimes doubled list of book titles:
    // =====================================================================
          // If the book title appears more than once, remove the double:
          // Dedup the double book titles --- which only appear sometimes?

          //   var alreadyHave = bookTitles.some(function(bookElement) {
          //   return (bookElement.title === element.title);
          // });
          //
          //  if (!alreadyHave) { // If returns false, push titles into bookTitles array
          //   bookTitles.push(titles);
          // }
  // =====================================================================

          // Grabbing links to each book page
          var bookUrls = element.attribs.href;
          allBookUrls.push(bookUrls);
        };
      });

      // Logging array of what should be single book titles
      // console.log(bookTitles); // ** Book titles are still sometimes doubled **

    // Calling function that selects 10 DIFFERENT books
    selectTenDifferentBooks(allBookUrls, selectedBookUrls);

    // Calling function that generates links for the 10 selected books
    generateBookUrls(selectedBookUrls, baseUrl, selectedBookLinks);

     // Calling function that navigates to each bookpage to collect data
    visitBookPage(selectedBookLinks);

    };
   });
};

function selectTenDifferentBooks(allBookUrls, selectedBookUrls) {
  var i = 0;
  while (selectedBookUrls.length < 10) {

      if (i % 2 === 0) { // if i is even
            selectedBookUrls.push(allBookUrls[i]);
      }
      i++;
  }
};

function generateBookUrls(selectedBookUrls, baseUrl, selectedBookLinks) {
  for (i = 0; i < selectedBookUrls.length; i++) {
     var bookLinks = baseUrl + selectedBookUrls[i];
     selectedBookLinks.push(bookLinks);
  };
};


// Function that takes in a selectedBookLinks
  // Navigates to that url, creates a Book Object with the following data points (if available):
  // Name, List Price, Description, Image URL, Weight
function visitBookPage(book) {
  book.forEach(function(url) {
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     var $ = cheerio.load(body);

     // Grabbing data point: Book Title
     var bookProductTitle = $("h1#title").find("#productTitle").text(); // Paper books
     var ebooksProductTitle = $("h1#title").find("#ebooksProductTitle").text(); // eBooks
     var bookTitle = bookProductTitle + ebooksProductTitle;
     //console.log(bookTitle)

     // Grabbing data point: List Price
     var listPrice; // ** KEEPS COMING UP BLANK **
     // $("div#buybox").find("div.a-box-inner a-padding-base").find("table.a-lineitem a-spacing-micro").find("tbody").find("tr.kindle-price").find("td.a-color-price a-size-medium a-align-bottom").text();
     // console.log(listPrice);

     // Grabbing data point: Description
      var bookDesc; // ** ONLY WORKS ON SOME BOOKS **
     // $("div#bookDescription_feature_div").find("noscript").text();
     // console.log(description);

     // Grabbing data point: Image URL
     var imgUrl; //** KEEP GETTING UNDEFINED **
     // var imgUrl = $("div#img-canvas").find("img.a-dynamic-image image-stretch-vertical frontImage").attr("src");
    //  console.log(imgUrl);

    // Grabbing data point: Weight
    var bookWeight; // ** CAN'T GET TO THE SPECIFIC <li> **
     //  $("table#productDetailsTable").text();
     // .find("tbody").find("tr").find("td.bucket").find("div.content").find("ul").children().text();
     // console.log(bookWeight);

     // Create a book object wih the colleted ata points
     var bookObj = {
       title: bookTitle,
       link: url,
       // price: listPrice,
       // description: bookDesc,
       // imageUrl: imgUrl,
       // weight: bookWeight
     };

     console.log(bookObj); // 10 book objects!
     saveData(bookObj);
     
   });
 });

};

// ** Only saves one of the book objects. **
  // ** Could not figure out (with my time limit of a given deadline) how to fix this. **
  var fileContent = results;
function saveData(results) {
  fs.writeFile("./bookData.json", JSON.stringify(fileContent, null, 4), (err) => {
    if (err) {
      console.error(err);
      return;
    };
    console.log("File has been created");
  });
};

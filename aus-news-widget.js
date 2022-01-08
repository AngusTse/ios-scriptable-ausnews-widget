/* SCRIPTABLE Hong Kong NEWS WIDGET
coded by Angus (https://twitter.com/angus_t)
 
 
 This project used to provide Hong Kong news widget with Scriptable.
 This project inspired from Saudumm (https://github.com/Saudumm/scriptable-News-Widget).  
 
 WIDGET PARAMETER: you can long press on the widget on your homescreen and edit parameters
 - It is comman separated configure. 
  1. Site name [9news]
  2. Is the feed shows thumbnail [true,false] 
 - example:  
     - `9news`   // showing 9news
 */

const C_FEED_TYPE = {
  RSS: "RSS",
  JSON: "JSON",
}

const configs = {
  "9news": {
    FEED_URL: "https://www.9news.com.au/rss",
    FEED_TYPE: C_FEED_TYPE.RSS,
    FEED_NAME: "9news"
  },
  "9news-nsw": {
    FEED_URL: "https://www.9news.com.au/new-south-wales/rss",
    FEED_TYPE: C_FEED_TYPE.RSS,
    FEED_NAME: "9news NSW"
  },
  "9news-vic": {
    FEED_URL: "https://www.9news.com.au/victoria/rss",
    FEED_TYPE: C_FEED_TYPE.RSS,
    FEED_NAME: "9news VIC"
  },
  "9news-qld": {
    FEED_URL: "https://www.9news.com.au/queensland/rss",
    FEED_TYPE: C_FEED_TYPE.RSS,
    FEED_NAME: "9news QLD"
  },
}
const STORAGE_DIR = "ausnews-widget-data"
const WIDGET_SIZE_SMALL = "small"
const WIDGET_SIZE_MEDIUM = "medium"
const WIDGET_SIZE_LARGE = "large"

let FEED_URL = configs["9news"].FEED_URL;
let FEED_TYPE = configs["9news"].FEED_URL;
let FEED_NAME = configs["9news"].FEED_NAME;
let SHOW_POST_IMAGES = false;

/*
 COLOR CONFIG: You can edit almost all colors of your widget
 Colors are now dynamic, the first value is the color used in light mode, the second value is used in dark mode.
 - FONT_COLOR_SITENAME: font color of the website name (FEED_NAME)
 - FONT_COLOR_POST_DATE: font color of the date/time label
 - FONT_COLOR_HEADLINE: font color of the post title
 */

let BG_COLOR = Color.dynamic(new Color("#fefefe"), new Color("#1c1c1e"));
const FONT_SITENAME = Font.heavySystemFont(10);
const FONT_COLOR_SITENAME = Color.dynamic(new Color("#1c1c1e"), new Color("#fefefe"));
const FONT_COLOR_POST_DATE = Color.dynamic(Color.darkGray(), Color.gray());
const FONT_COLOR_HEADLINE = Color.dynamic(new Color("#1c1c1e"), new Color("#fefefe"));

const WIDGET_SIZE = (config.runsInWidget ? config.widgetFamily : WIDGET_SIZE_LARGE);

// set the number and font size of posts depending on WIDGET_SIZE
let POST_COUNT = 3;
const FONT_POST_DATE = Font.heavySystemFont(10);
const FONT_POST_HEADLINE = Font.heavySystemFont(10);
// const POST_IMAGE_SIZE = new Size(30,30);

// set the feed, post count
setWidgetParameters();

// Create Widget
const widget = await createWidget();

if (!config.runsInWidget) {
  switch (WIDGET_SIZE) {
    case "small":
      await widget.presentSmall();
      break;
    case "medium":
      await widget.presentMedium();
      break;
    case "large":
      await widget.presentLarge();
      break;
  }
}
Script.setWidget(widget);
Script.complete();

/**
 * Extract arguments in to widget parameters
 */
function setWidgetParameters() {
  if (args.widgetParameter) {
    const site = args.widgetParameter;

    if (configs[site] == undefined) 
      logError(`Unsupported site: ${site}`);
    else 
      ({FEED_URL, FEED_TYPE, FEED_NAME} = configs[site]);
  }

  switch (WIDGET_SIZE) {
    case WIDGET_SIZE_SMALL:
      POST_COUNT = 3;
      break;
    case WIDGET_SIZE_MEDIUM:
      POST_COUNT = 4;
      break;
    case WIDGET_SIZE_LARGE:
      POST_COUNT = 10;
      break;
  }
}

/**
 * Create widget
 * @returns {ListWidget}
 */
async function createWidget() {

  const postData = await getData();
  
  const list = new ListWidget();
  
  // display name of the website
  const siteName = list.addText(FEED_NAME.toUpperCase());
  siteName.font = FONT_SITENAME;
  siteName.textColor = FONT_COLOR_SITENAME;
  
  list.addSpacer();
  
  if (postData) {
    const aStackRow = new Array(POST_COUNT);
    const aStackCol = new Array(POST_COUNT);
    const aLblPostDate = new Array(POST_COUNT);
    const aLblPostTitle = new Array(POST_COUNT);

    for (let i = 0; i < POST_COUNT; i++) {
      aStackRow[i] = list.addStack();
      aStackRow[i].layoutHorizontally();
      aStackRow[i].url = postData.aPostURLs[i];
      
      aStackCol[i] = aStackRow[i].addStack();
      aStackCol[i].layoutVertically();
      
      aLblPostDate[i] = aStackCol[i].addText(
        new Date(postData.aPostDates[i]).toLocaleString([], 
          {year: "numeric", month: "2-digit", day: "2-digit", 
            hour: "2-digit", minute: "2-digit"}));
      aLblPostDate[i].font = FONT_POST_DATE;
      aLblPostDate[i].textColor = FONT_COLOR_POST_DATE;
      aLblPostDate[i].lineLimit = 1;
      aLblPostDate[i].minimumScaleFactor = 0.5;
      
      aLblPostTitle[i] = aStackCol[i].addText(postData.aPostTitles[i]);
      aLblPostTitle[i].font = FONT_POST_HEADLINE;
      aLblPostTitle[i].textColor = FONT_COLOR_HEADLINE;
      aLblPostTitle[i].lineLimit = 2;
      
      if (i < POST_COUNT-1) {list.addSpacer();}
    }
  } else {
    siteName.textColor = Color.white();
    
    const sad_face = list.addText(":(")
    sad_face.font = Font.regularSystemFont(WIDGET_SIZE === WIDGET_SIZE_LARGE ? 190 : 72);
    sad_face.textColor = Color.white();
    sad_face.lineLimit = 1;
    sad_face.minimumScaleFactor = 0.1;
    
    list.addSpacer();
    
    const err_msg = list.addText("Couldn't load data");
    err_msg.font = Font.regularSystemFont(12);
    err_msg.textColor = Color.white();
    
    BG_COLOR = new Color("#1f67b1");
  }

  return list;
}

async function parseRssData() {
  try {
    const xml = await new Request(FEED_URL).loadString();
    const xmlParser = new XMLParser(xml);
    
    const rssItems = new Array();
    let itemValue = null;
    let currentItem = null;

    xmlParser.didStartElement = (name, elementContent) => {
      itemValue = "";
      if (name == "entry" || name == "item") {
        currentItem = {};
      }
    }
    
    // end of element
    xmlParser.didEndElement = name => {
      
      if (currentItem == null) return;
      
      // possible url location
      if (name == "id") {currentItem["id"] = itemValue;}
      
      // possible url location
      if (name == "link") {currentItem["url"] = itemValue;}
      
      // title value
      if (name == "title") {currentItem["title"] = itemValue;}

      // published date
      if ((name == "published" || name == "pubDate" || name == "updated")) {
        currentItem["date"] = itemValue;
      }

      // end of item/entry block
      if (name == "entry" || name == "item") {
        rssItems.push(currentItem);
        currentItem = null;
      }
    }

    // found characters between element start and end
    xmlParser.foundCharacters = str => {itemValue += str;}
    // end of document
    xmlParser.didEndDocument = () => {}
    // parse xml string
    await xmlParser.parse();

    return rssItems;

  } catch (err) {
    logError(err)
    return null;
  }
}

/**
 * Get data from SITE.FEED_URL and format the data for display
 * @returns {Array}
 */
async function getData() {
  try {
    const aPostDates = await new Array(POST_COUNT);
    const aPostTitles = await new Array(POST_COUNT);
    const aPostURLs = await new Array(POST_COUNT);

    const rssData = await parseRssData();

    for (let i = 0; i < POST_COUNT; i++) {
      if (i > rssData.length)
        logError("index out of boundard");


      let itemObj = rssData[i];
  
      aPostDates[i] = itemObj.date;
      aPostTitles[i] = itemObj.title;
      aPostURLs[i] = itemObj.url
      
    }
    
    const result = {
      aPostDates: aPostDates,
      aPostTitles: aPostTitles,
      aPostURLs: aPostURLs,
    };
    
    return result;
  } catch (err) {
    logError(err)
    return null;
  }
}

/**
 * format the post title and replace all html entities with characters
 * @param {String} strHeadline 
 * @returns {String} string with the title, readable by a human being
 */
function formatPostTitle(strHeadline) {
  strHeadline = strHeadline.replaceAll("&quot;", '"');
  strHeadline = strHeadline.replaceAll("&amp;", "&");
  strHeadline = strHeadline.replaceAll("&lt;", "<");
  strHeadline = strHeadline.replaceAll("&gt;", ">");
  strHeadline = strHeadline.replaceAll("&apos;", "'");
  strHeadline = strHeadline.replaceAll("&#034;", '"');
  strHeadline = strHeadline.replaceAll("&#038;", "&");
  strHeadline = strHeadline.replaceAll("&#039;", "'");
  strHeadline = strHeadline.replaceAll("&#060;", "<");
  strHeadline = strHeadline.replaceAll("&#062;", ">");
  strHeadline = strHeadline.replaceAll("&#338;", "Œ");
  strHeadline = strHeadline.replaceAll("&#339;", "œ");
  strHeadline = strHeadline.replaceAll("&#352;", "Š");
  strHeadline = strHeadline.replaceAll("&#353;", "š");
  strHeadline = strHeadline.replaceAll("&#376;", "Ÿ");
  strHeadline = strHeadline.replaceAll("&#710;", "ˆ");
  strHeadline = strHeadline.replaceAll("&#732;", "˜");
  strHeadline = strHeadline.replaceAll("&#8211;", "–");
  strHeadline = strHeadline.replaceAll("&#8212;", "—");
  strHeadline = strHeadline.replaceAll("&#8216;", "‘");
  strHeadline = strHeadline.replaceAll("&#8217;", "’");
  strHeadline = strHeadline.replaceAll("&#8218;", "‚");
  strHeadline = strHeadline.replaceAll("&#8220;", "“");
  strHeadline = strHeadline.replaceAll("&#8221;", "”");
  strHeadline = strHeadline.replaceAll("&#8222;", "„");
  strHeadline = strHeadline.replaceAll("&#8224;", "†");
  strHeadline = strHeadline.replaceAll("&#8225;", "‡");
  strHeadline = strHeadline.replaceAll("&#8230;", "…");
  strHeadline = strHeadline.replaceAll("&#8240;", "‰");
  strHeadline = strHeadline.replaceAll("&#8249;", "‹");
  strHeadline = strHeadline.replaceAll("&#8250;", "›");
  strHeadline = strHeadline.replaceAll("&#8364;", "€");
  strHeadline = strHeadline.replaceAll("<![CDATA[", "");
  strHeadline = strHeadline.replaceAll("]]>", "");
  return strHeadline;
}

// end of script
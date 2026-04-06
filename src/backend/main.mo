import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Timer "mo:core/Timer";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Outcall "http-outcalls/outcall";

actor {

  // ─── Types ────────────────────────────────────────────────────────────────

  public type Article = {
    id : Text;
    title : Text;
    description : Text;
    link : Text;
    pubDate : Text;
    pubTimestamp : Int;
    sourceName : Text;
    imageUrl : Text;
    category : Text;
    language : Text;
  };

  // ─── Stable State ─────────────────────────────────────────────────────────

  var articlesStore : [(Text, [Article])] = [];
  var lastUpdated : Int = 0;

  var cache : Map.Map<Text, [Article]> = Map.fromArray(articlesStore);

  system func preupgrade() {
    articlesStore := cache.toArray();
  };

  system func postupgrade() {
    cache := Map.fromArray(articlesStore);
  };

  // ─── Constants ────────────────────────────────────────────────────────────

  let CATEGORIES : [(Text, Text)] = [
    ("cricket",       "cricket"),
    ("technology",    "technology"),
    ("business",      "business"),
    ("celebrity",     "celebrity"),
    ("politics",      "politics"),
    ("entertainment", "entertainment"),
  ];

  // (langCode, hl, gl, ceid)
  let LANGUAGES : [(Text, Text, Text, Text)] = [
    ("en", "en-IN", "IN", "IN:en"),
    ("hi", "hi",    "IN", "IN:hi"),
    ("ta", "ta",    "IN", "IN:ta"),
    ("te", "te",    "IN", "IN:te"),
    ("bn", "bn",    "IN", "IN:bn"),
    ("mr", "mr",    "IN", "IN:mr"),
    ("gu", "gu",    "IN", "IN:gu"),
    ("kn", "kn",    "IN", "IN:kn"),
    ("ml", "ml",    "IN", "IN:ml"),
    ("pa", "pa",    "IN", "IN:pa"),
  ];

  // ─── URL Builder ──────────────────────────────────────────────────────────

  func buildUrl(topic : Text, hl : Text, gl : Text, ceid : Text) : Text {
    if (topic == "headlines") {
      "https://news.google.com/rss?hl=" # hl # "&gl=" # gl # "&ceid=" # ceid
    } else {
      "https://news.google.com/rss/search?q=" # topic # "&hl=" # hl # "&gl=" # gl # "&ceid=" # ceid
    };
  };

  // ─── XML Helpers ──────────────────────────────────────────────────────────

  // Returns text between first <tag> and </tag>, or "" if not found.
  func extractTag(xml : Text, tag : Text) : Text {
    let open  = "<" # tag # ">";
    let close = "</" # tag # ">";
    var parts = xml.split(#text open);
    ignore parts.next();
    switch (parts.next()) {
      case null { "" };
      case (?after) {
        switch (after.split(#text close).next()) {
          case null     { "" };
          case (?content) { stripCdata(content) };
        };
      };
    };
  };

  func stripCdata(s : Text) : Text {
    let cdataOpen  = "<![CDATA[";
    let cdataClose = "]]>";
    if (not s.startsWith(#text cdataOpen)) { return s };
    var inner = s.split(#text cdataOpen);
    ignore inner.next();
    switch (inner.next()) {
      case null { s };
      case (?afterOpen) {
        switch (afterOpen.split(#text cdataClose).next()) {
          case null       { afterOpen };
          case (?stripped) { stripped };
        };
      };
    };
  };

  // Extract value of attr="..." from a tag string.
  func extractAttr(tagText : Text, attr : Text) : Text {
    let needle = attr # "=\"";
    var parts = tagText.split(#text needle);
    ignore parts.next();
    switch (parts.next()) {
      case null { "" };
      case (?after) {
        switch (after.split(#text "\"").next()) {
          case null    { "" };
          case (?val)  { val };
        };
      };
    };
  };

  func extractImage(description : Text, fullItem : Text) : Text {
    // Try media:content url=
    if (fullItem.contains(#text "media:content")) {
      var parts = fullItem.split(#text "media:content");
      ignore parts.next();
      switch (parts.next()) {
        case null {};
        case (?seg) {
          let u = extractAttr(seg, "url");
          if (u.size() > 0) { return u };
        };
      };
    };
    // Try enclosure url=
    if (fullItem.contains(#text "enclosure")) {
      var parts = fullItem.split(#text "enclosure");
      ignore parts.next();
      switch (parts.next()) {
        case null {};
        case (?seg) {
          let u = extractAttr(seg, "url");
          if (u.size() > 0) { return u };
        };
      };
    };
    // Try <img src= in description HTML
    if (description.contains(#text "<img")) {
      var parts = description.split(#text "<img");
      ignore parts.next();
      switch (parts.next()) {
        case null {};
        case (?seg) {
          let u = extractAttr(seg, "src");
          if (u.size() > 0) { return u };
        };
      };
    };
    "";
  };

  func stripHtml(html : Text) : Text {
    var result = "";
    var inTag = false;
    for (c in html.chars()) {
      if      (c == '<') { inTag := true  }
      else if (c == '>') { inTag := false }
      else if (not inTag) { result #= Text.fromChar(c) };
    };
    result;
  };

  // ─── RSS Parser ───────────────────────────────────────────────────────────

  func parseItems(xml : Text, category : Text, language : Text) : [Article] {
    var articles : [Article] = [];
    var idx : Nat = 0;

    var itemParts = xml.split(#text "<item>");
    ignore itemParts.next(); // skip channel header

    for (itemXml in itemParts) {
      let itemContent = switch (itemXml.split(#text "</item>").next()) {
        case null  { itemXml };
        case (?c)  { c };
      };

      let title     = stripHtml(extractTag(itemContent, "title"));
      let link      = extractTag(itemContent, "link");
      let descRaw   = extractTag(itemContent, "description");
      let pubDate   = extractTag(itemContent, "pubDate");
      let source    = extractTag(itemContent, "source");
      let imageUrl  = extractImage(descRaw, itemContent);
      let cleanDesc = stripHtml(descRaw);

      if (title.size() > 0 and link.size() > 0) {
        let article : Article = {
          id           = language # "-" # category # "-" # idx.toText();
          title;
          description  = cleanDesc;
          link;
          pubDate;
          pubTimestamp = Time.now();
          sourceName   = if (source.size() > 0) source else "Google News";
          imageUrl;
          category;
          language;
        };
        articles := articles.concat([article]);
        idx += 1;
      };
    };
    articles;
  };

  // ─── Transform (required for HTTP outcalls) ───────────────────────────────

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input);
  };

  // ─── Feed Refresh ─────────────────────────────────────────────────────────

  func fetchAndStore(
    topic    : Text,
    category : Text,
    lang     : Text,
    hl       : Text,
    gl       : Text,
    ceid     : Text,
  ) : async () {
    let url = buildUrl(topic, hl, gl, ceid);
    try {
      let xml      = await Outcall.httpGetRequest(url, [], transform);
      let articles = parseItems(xml, category, lang);
      let key      = lang # ":" # category;
      cache.add(key, articles);

      // Merge into the "all" bucket for this language
      let allKey   = lang # ":all";
      let existing = switch (cache.get(allKey)) {
        case null   { [] };
        case (?arr) { arr };
      };
      cache.add(allKey, existing.concat(articles));
    } catch (_) {
      // silently skip failed fetches
    };
  };

  public func refreshFeeds() : async () {
    // Clear all-category caches before rebuilding
    for ((langCode, _, _, _) in LANGUAGES.vals()) {
      cache.remove(langCode # ":all");
    };

    for ((langCode, hl, gl, ceid) in LANGUAGES.vals()) {
      for ((category, topic) in CATEGORIES.vals()) {
        await fetchAndStore(topic, category, langCode, hl, gl, ceid);
      };
    };
    lastUpdated := Time.now();
  };

  // ─── Timers ───────────────────────────────────────────────────────────────

  let ONE_HOUR_NS : Nat = 3_600_000_000_000;

  ignore Timer.recurringTimer<system>(
    #nanoseconds ONE_HOUR_NS,
    func() : async () { await refreshFeeds() },
  );

  ignore Timer.setTimer<system>(
    #nanoseconds 2_000_000_000,
    func() : async () { await refreshFeeds() },
  );

  // ─── Queries ──────────────────────────────────────────────────────────────

  public query func getArticles(category : Text, language : Text) : async [Article] {
    switch (cache.get(language # ":" # category)) {
      case null    { [] };
      case (?arts) { arts };
    };
  };

  public query func getBreakingNews(language : Text) : async [Article] {
    let articles = switch (cache.get(language # ":all")) {
      case null   { [] };
      case (?arr) { arr };
    };
    let count = if (articles.size() < 5) articles.size() else 5;
    articles.sliceToArray(0, count);
  };

  public query func getLastUpdated() : async Int {
    lastUpdated;
  };

  public query func getStatus() : async Text {
    let total = cache.toArray().foldLeft(
      0,
      func(acc : Nat, pair : (Text, [Article])) : Nat { acc + pair.1.size() },
    );
    "Articles cached: " # total.toText() # " | Last updated: " # lastUpdated.toText();
  };
};

import { Request, Response } from "express";
import puppeteer from "puppeteer";

interface Post {
  image: string;
  id: string;
}

export async function getPostsByHastag(req: Request, res: Response) {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let hashtag = req.params.hashtag || "instagram";

  // Navigate the page to a URL
  await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/top/`);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  await page.waitForSelector("text/Top posts");

  let posts: Post[] = await page.evaluate(() => {
    let postArray: Post[] = [];
    let anchors = [...document.querySelectorAll("a")];
    anchors.forEach((a) => {
      if (a.href.startsWith("https://www.instagram.com/p/")) {
        let images = [...a.querySelectorAll("img")];
        let imageUrls = images.map((img) => img.src);
        if (imageUrls.length) {
          postArray.push({
            image: imageUrls[0],
            id: a.href.split("https://www.instagram.com/p/")[1],
          });
        }
      }
    });
    return postArray;
  });

  posts = await Promise.all(
    posts.map(async (post: Post): Promise<Post> => {
      const response: any = await fetch(post.image);
      const base64_body = await response.arrayBuffer();
      let data =
        "data:" +
        response.headers.get("content-type") +
        ";base64," +
        base64ArrayBuffer(base64_body);

      return {
        image: data,
        id: post.id,
      };
    })
  );

  browser.close();
  res.setHeader("Content-Type", "application/json");
  res.send(posts);
}

export async function getPostById(req: Request, res: Response) {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let postId = req.params.postId || "C2oTjMqr-Bs/";

  // Navigate the page to a URL
  await page.goto(`https://www.instagram.com/p/${postId}`);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  await page.waitForSelector("text/Log In");

  const post = await page.evaluate(() => {
    let postObj: any = {
      title: "Empty",
      comments: [],
    };
    let h1: any = document.querySelector("h1");
    postObj.title = h1.textContent;

    let h2: any = document.querySelector("h2");
    postObj.author = h2.textContent;

    let authorImage: any = document.querySelector("li div div div a img");
    postObj.authorImage = authorImage.src;

    let commentUsers = [...document.querySelectorAll("h3")];
    let commentUsersText: any = [];
    commentUsers.forEach((commentUser) => {
      commentUsersText.push(commentUser.textContent);
    });

    let comments = [...document.querySelectorAll("h3 + div")];
    let commentsText: any = [];
    comments.forEach((comment) => {
      commentsText.push(comment.textContent);
    });

    postObj.comments = commentsText.map((comment: string, idx: number) => {
      return {
        comment,
        commentUser: commentUsersText[idx],
      };
    });

    return postObj;
  });

  const response: any = await fetch(post.authorImage);
  const base64_body = await response.arrayBuffer();
  post.authorImage =
    "data:" +
    response.headers.get("content-type") +
    ";base64," +
    base64ArrayBuffer(base64_body);

  browser.close();
  res.setHeader("Content-Type", "application/json");
  res.send(post);
}

function base64ArrayBuffer(arrayBuffer: any) {
  var base64 = "";
  var encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }

  return base64;
}

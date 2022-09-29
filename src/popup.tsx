import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { makeApiCalls } from "./api";
import { Options } from "./options";
import "./popup.scss";
const spinner = require("../public/loading-buffering.gif");
import { storage } from "@extend-chrome/storage";

const Popup = () => {
  const [currentURL, setCurrentURL] = useState<string>();
  const [isMcdonaldsHomeOpen, setIsMcdonaldsHomeOpen] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [averageOrder, setAverageOrder] = useState<string>();
  const [totalOrder, setTotalOrder] = useState<number>(0);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentURL(tabs[0].url);
      console.log(tabs[0].url);
    });
  }, []);

  useEffect(() => {
    console.log(currentURL);
    if (currentURL) {
      const url = new URL(currentURL);
      console.log(url);
      if (url.hostname === "www.mcdelivery.co.in") {
        if (url.pathname === "/tracking/myOrders") {
          console.log("inside");
          setIsMcdonaldsHomeOpen(true);
          const val = "userData";
          chrome.storage.managed.get(val, (item) => {
            console.log(item, item[val]);
          });
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab.id) {
              chrome.tabs.sendMessage(
                currentTab.id,
                { type: "getAuthStatus" },
                (response) => {
                  setIsSignedIn(true);
                }
              );
              getCookies();
            }
          });
        } else {
          console.log("wrong pathname");
        }
      } else {
        console.log("wrong hostname");
      }
    }
  }, [currentURL]);

  const getCookies = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    const val: number = tab.id !== undefined ? tab.id : 0;
    console.log(val);
    const fromPageLocalStore = await chrome.scripting.executeScript({
      target: { tabId: val },
      func: () => {
        const value = localStorage["userData"];
        return value;
      },
    });
    const userData = fromPageLocalStore[0].result;
    setIsLoading(true);
    try {
      const results = await makeApiCalls(userData);
      console.log(results.total);
      setTotalCost(results.total);
      const avg = (results.total / results.quantity).toFixed(1);
      setAverageOrder(avg);
      setTotalOrder(results.quantity);
      setIsLoading(false);
      setIsError(false);
      setIsSignedIn(true);
      setIsMcdonaldsHomeOpen(true);
    } catch (err) {
      setIsLoading(false);
      setIsError(true);
      setIsSignedIn(false);
    }
  };
  return (
    <>
      <div className="popup-body">
        <div className="popup-header">Mcdonalds Spending Calculator</div>
        <div className="option-button">
          <button onClick={() => setIsOptionsOpen(!isOptionsOpen)}>
            {isOptionsOpen ? "Hide Options" : "Show Options"}
          </button>
        </div>
        {isOptionsOpen && <Options />}
        {isMcdonaldsHomeOpen ? (
          isSignedIn ? (
            <div className="info-body">
              <p className="webpage-info">Mcdonalds Home is open</p>
              <p className="auth-info">
                {" "}
                You are currently Signed In to Mcdonalds Website
              </p>
              {isError && <p className="error">Error while fetching data</p>}
              <p className="amount-info">
                Total Amount Spent :{" "}
                <b>
                  {isLoading ? (
                    <>
                      <img
                        src={String(spinner)}
                        alt="loading..."
                        height="20px"
                        width="20px"
                      />{" "}
                      <span>(Fetching Data....)</span>{" "}
                    </>
                  ) : (
                    `₹${totalCost}`
                  )}
                </b>
              </p>
              <p className="auth-info">
                Average Amount Per Order :{" "}
                <b>
                  {isLoading ? (
                    <>
                      <img
                        src={String(spinner)}
                        alt="loading..."
                        height="20px"
                        width="20px"
                      />{" "}
                      <span>(Fetching Data....)</span>{" "}
                    </>
                  ) : (
                    `₹${averageOrder}`
                  )}
                </b>
              </p>
              <p className="webpage-info">
                Total Orders :{" "}
                <b>
                  {isLoading ? (
                    <>
                      <img
                        src={String(spinner)}
                        alt="loading..."
                        height="20px"
                        width="20px"
                      />{" "}
                      <span>(Fetching Data....)</span>{" "}
                    </>
                  ) : (
                    `${totalOrder}`
                  )}
                </b>
              </p>
            </div>
          ) : (
            <div className="info-body">
              <p className="webpage-info">Mcdonalds Home is open</p>
              <p className="auth-info">
                You are not signed in , please sign in to Mcdonalds to continue.
              </p>
            </div>
          )
        ) : (
          <div className="info-body">
            <p className="webpage-info">Mcdonalds Order Page is not open</p>
            <p className="webpage-redirect">
              Open{" "}
              <a
                href="https://www.mcdelivery.co.in/tracking/myOrders"
                target="_blank"
              >
                www.mcdelivery.co.in
              </a>{" "}
              on your browser, then use this extension
            </p>
          </div>
        )}
      </div>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);

import logo from "./logo.svg";
import "./App.css";

import { useEffect, useState } from "react";

import * as wx from "@tybys/jweixin";
import getDistance from "geolib/es/getPreciseDistance";

import { DateTimeInput } from "./DateTimeInput";
import moment from "moment";

// gcj02 coordinates for the destination, make sure the coordinate you get from the location service is also in gcj02
const locationA = { latitude: 23.122012, longitude: 113.328508 };
const locationB = { latitude: 34.212494, longitude: 108.840383 };

function App() {
  const [isStartVXLocating, setIsStartVXLocating] = useState(false);
  const [isStartH5Locating, setIsStartH5Locating] = useState(false);

  const [isH5LocationAcquired, setIsH5LocationAcquired] = useState(false);
  const [h5UserLocationLat, setH5UserLocationLat] = useState(null);
  const [h5UserLocationLon, setH5UserLocationLon] = useState(null);

  const [isVXLocationAcquired, setIsVXLocationAcquired] = useState(false);
  const [vxUserLocationLat, setVXUserLocationLat] = useState(null);
  const [vxUserLocationLon, setVXUserLocationLon] = useState(null);

  const [selectDateTime, setSelectDateTime] = useState(moment());

  const [checkInDistance, setCheckInDistance] = useState(500);
  const [checkInStatusDescription, setCheckInStatusDescription] = useState(
    "you are not checked in"
  );

  function isWeiXinBrowser() {
    var agent = navigator.userAgent.toLocaleLowerCase();
    if (agent.match(/MicroMessenger/i) === "micromessenger") {
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    if (isStartVXLocating) {
      alert("try to locate you by weixin sdk")
      tryLocateByVX();
    }
    if (isStartH5Locating) {
      alert("try to locate you by h5 geolocation")
      tryLocateByH5();
    }
  }, [isStartVXLocating, isStartH5Locating]);

  async function tryLocateByVX() {
  // const tryLocateByVX = async () => {
    try {
      // use your vx sdk signature service here
      const response = await fetch("your service", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jsonAuthData = await response.json();

      wx.config({
        debug: true,
        appId: jsonAuthData.appId,
        timestamp: jsonAuthData.timestamp,
        nonceStr: jsonAuthData.nonceStr,
        signature: jsonAuthData.signature,
        jsApiList: ["getLocation"],
      });

      wx.ready(function () {
        console.log("wx js sdk config ready, begin to request location");
        wx.getLocation({
          type: "gcj02",
          success: function (res) {
            setVXUserLocationLat(res.latitude);
            setVXUserLocationLon(res.longitude);
            setIsVXLocationAcquired(true);
            checkIn();
            // var speed = res.speed;
            // var accuracy = res.accuracy;
          },
        });
      });
      wx.error(function (res) {
        alert("vx auth error:" + res);
        console.log("vx auth error:", res);
      });
    } catch (e) {
      alert("vx config error:" + e);
      console.log("wx config error:", e);
    }
  };

  async function tryLocateByH5() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setH5UserLocationLat(position.coords.latitude);
          setH5UserLocationLon(position.coords.longitude);
          setIsH5LocationAcquired(true);
          checkIn();
        },
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              alert("Permission Denied!");
              break;
            case err.POSITION_UNAVAILABLE:
              alert("Location information unavailable!");
              break;
            case err.TIMEOUT:
              alert("Timeout!");
              break;
            case err.UNKNOWN_ERROR:
              alert("Unknown error");
              break;
            default:
              alert("h5 get position error:" + err);
              console.log("h5 get position error:", err);
              break;
          }
        }
      );
    } else {
      alert("Sorry, your browser doesn't support geolocation!");
    }
  }

  function checkIn() {

    if (moment() < selectDateTime) {
      alert("please only check in on the party day!");
      return;
    }

    if (!isStartH5Locating && !isStartH5Locating) {
      alert ("starting locating your position...")
      if (isWeiXinBrowser()){
        alert("you are using weixin browser")
        setIsStartVXLocating(true);
      } else {
        alert("you are using other browser")
        setIsStartH5Locating(true);
      }
    }

    if (!isH5LocationAcquired && !isVXLocationAcquired) {
      alert("hold on , locating in progress...");
      return;
    }

    var userDistanceToNearestParty = Number.MAX_VALUE;
    var userDistanceToNearest_VX = Number.MAX_VALUE;
    var userDistanceToNearest_H5 = Number.MAX_VALUE;

    if (isVXLocationAcquired) {
      var userDistanceToA_VX = getDistance(
        {
          latitude: vxUserLocationLat,
          longitude: vxUserLocationLon,
        },
        locationA
      );
      var userDistanceToB_VX = getDistance(
        {
          latitude: vxUserLocationLat,
          longitude: vxUserLocationLon,
        },
        locationB
      );
      userDistanceToNearest_VX = Math.min(
        userDistanceToA_VX,
        userDistanceToB_VX
      );
    }

    if (isH5LocationAcquired) {
      var userDistanceToA_H5 = getDistance(
        {
          latitude: h5UserLocationLat,
          longitude: h5UserLocationLon,
        },
        locationA
      );
      var userDistanceToB_H5 = getDistance(
        {
          latitude: h5UserLocationLat,
          longitude: h5UserLocationLon,
        },
        locationB
      );
      userDistanceToNearest_H5 = Math.min(
        userDistanceToA_H5,
        userDistanceToB_H5
      );
    }
    userDistanceToNearestParty = Math.min(
      userDistanceToNearest_VX,
      userDistanceToNearest_H5
    );

    if (userDistanceToNearestParty <= checkInDistance) {
      alert("You have checked in the party, enjoy!");
      setCheckInStatusDescription("You are checked in.");
    } else {
      alert(
        "Sorry, you are too far away from the party location by " +
          userDistanceToNearestParty +
          " metres"
      );
      setCheckInStatusDescription("You are not yet checked in");
    }
  }

  var vxLocationDescription;
  var h5LocationDescription;

  if (isVXLocationAcquired) {
    vxLocationDescription =
      "You are located at (lat: " +
      vxUserLocationLat +
      ", lon: " +
      vxUserLocationLon +
      ")";
  } else {
    vxLocationDescription = "pending location data";
  }

  if (isH5LocationAcquired) {
    h5LocationDescription =
      "You are located at (lat: " +
      h5UserLocationLat +
      ", lon: " +
      h5UserLocationLon +
      ")";
  } else {
    h5LocationDescription = "pending location data";
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h4>eTicket geofence check-in demo</h4>
        <br />
        {/* disabled={!isH5LocationAcquired && !isVXLocationAcquired}  */}

        <label>{checkInStatusDescription} </label>
        <button className="checkInButton" onClick={checkIn}>
          Check In
        </button>

        <br />
        <p>
          --------------------------- debug setting --------------------------
        </p>
        <DateTimeInput
          value={selectDateTime}
          onChange={(newValue) => {
            setSelectDateTime(newValue);
          }}
        />
        <p>you can only check in after {selectDateTime.toLocaleString()}</p>
        <br />

        {/* <button
          className="niceButton"
          onClick={() => setIsStartVXLocating(true)}
        >
          Locate me (WeiXin)
        </button> */}
        <button
          className="niceButton"
          onClick={tryLocateByVX}
        >
          Locate me (WeiXin)
        </button>
        <label> {vxLocationDescription}</label>

        <br />

        {/* <button className="niceButton" onClick={() => setIsStartH5Locating(true)}>
          Locate me (H5)
        </button> */}
        <button className="niceButton" onClick={tryLocateByH5}>
          Locate me (H5)
        </button>        
        <label> {h5LocationDescription}</label>

        <br />

        <label>debug distance for check-in : </label>
        <input
          type="text"
          value={checkInDistance}
          onChange={(e) => setCheckInDistance(e.target.value)}
          placeholder="distance in metres"
        ></input>
        <label> metres </label>
        <p>
          go within {checkInDistance.toLocaleString()} metres of target
          location to check in.
        </p>
        <br />
      </header>
    </div>
  );
}

export default App;

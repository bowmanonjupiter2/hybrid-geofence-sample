import logo from "./logo.svg";
import "./App.css";

import { useEffect, useState } from "react";

import * as wx from "@tybys/jweixin";
import getDistance from "geolib/es/getPreciseDistance";

import { DateTimeInput } from "./DateTimeInput";
import moment from "moment";

// gcj02 coordinates for the destination, make sure the coordinate you get from the location service is also in gcj02
const locationA = {
  latitude: "specify your value",
  longitude: "specify your value",
};
const locationB = {
  latitude: "specify your value",
  longitude: "specify your value",
};

function App() {
  const [selectDateTime, setSelectDateTime] = useState(moment());
  const [checkInStatus, setCheckInStatus] = useState(false);

  const [checkInDistance, setCheckInDistance] = useState(500);

  const [isWXLocatingInProgress, setIsWXLocatingInProgress] = useState(false);
  const [isWXLocationAcquired, setIsWXLocationAcquired] = useState(false);
  const [wxUserLocationLat, setWXUserLocationLat] = useState(null);
  const [wxUserLocationLon, setWXUserLocationLon] = useState(null);

  const [isH5LocatingInProgress, setIsH5LocatingInProgress] = useState(false);
  const [isH5LocationAcquired, setIsH5LocationAcquired] = useState(false);
  const [h5UserLocationLat, setH5UserLocationLat] = useState(null);
  const [h5UserLocationLon, setH5UserLocationLon] = useState(null);

  function isWXBrowser() {
    var agent = navigator.userAgent.toLocaleLowerCase();

    if (agent.match(/MicroMessenger/i) == "micromessenger") {
      return true;
    } else {
      return false;
    }
  }

  async function tryLocateByWX() {
    setIsWXLocatingInProgress(true);
    try {
      const response = await fetch(
        "config your url for fetching wx js sdk signature data here",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

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
        console.log("wx js sdk config ready, start to request location");
        wx.getLocation({
          type: "gcj02",
          success: function (res) {
            setWXUserLocationLat(res.latitude);
            setWXUserLocationLon(res.longitude);
            setIsWXLocationAcquired(true);
            setIsWXLocatingInProgress(false);
          },
        });
      });
      wx.error(function (res) {
        setIsWXLocationAcquired(false);
        setIsWXLocatingInProgress(false);
        console.log("wx js sdk config failure:", res);
        console.log("try switch to use H5 geolocation");
        tryLocateByH5();
      });
    } catch (e) {
      setIsWXLocationAcquired(false);
      setIsWXLocatingInProgress(false);
      console.log("get wx js sdk signature failure:", e);
      console.log("try switch to use H5 geolocation");
      tryLocateByH5();
    }
  }

  async function tryLocateByH5() {
    setIsH5LocatingInProgress(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setH5UserLocationLat(position.coords.latitude);
          setH5UserLocationLon(position.coords.longitude);
          setIsH5LocationAcquired(true);
          setIsH5LocatingInProgress(false);
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
          setIsH5LocationAcquired(false);
          setIsH5LocatingInProgress(false);
        }
      );
    } else {
      setIsH5LocationAcquired(false);
      setIsH5LocatingInProgress(false);
      alert("sorry, your browser doesn't support geolocation!");
      console.log("user browser not support h5 geolocation");
    }
  }

  useEffect(() => {
    if (isWXLocationAcquired || isH5LocationAcquired) {
      checkIn();
    }
  }, [isH5LocationAcquired, isWXLocationAcquired]);

  function checkIn() {
    if (checkInStatus) {
      return;
    }

    if (moment() < selectDateTime) {
      alert("please only check in after the specified date/time");
      return;
    }

    if (isWXLocatingInProgress || isH5LocatingInProgress) {
      console.log("locating in progress, ignore this check in");
      return;
    } else {
      console.log("start locating user position...");
      if (isWXBrowser()) {
        console.log("user is using weixin browser");
        tryLocateByWX();
      } else {
        console.log("user is not using weixin browser");
        tryLocateByH5();
      }
    }

    if (!isH5LocationAcquired && !isWXLocationAcquired) {
      console.log("no location data, skip this check in");
      return;
    }

    var userDistanceToNearestParty = Number.MAX_VALUE;
    var userDistanceToNearest_VX = Number.MAX_VALUE;
    var userDistanceToNearest_H5 = Number.MAX_VALUE;

    if (isWXLocationAcquired) {
      var userDistanceToA_VX = getDistance(
        {
          latitude: wxUserLocationLat,
          longitude: wxUserLocationLon,
        },
        locationA
      );

      var userDistanceToB_VX = getDistance(
        {
          latitude: wxUserLocationLat,
          longitude: wxUserLocationLon,
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
      setCheckInStatus(true);
      alert("you have checked in now.");
      console.log("user has checked in.");
    } else {
      alert(
        "Sorry, you are still too far away from the target location by " +
          userDistanceToNearestParty +
          " metres"
      );
      setCheckInStatus(false);
    }
  }

  var vxLocationDescription;
  var h5LocationDescription;

  if (isWXLocationAcquired) {
    vxLocationDescription =
      "You are located at (lat: " +
      wxUserLocationLat +
      ", lon: " +
      wxUserLocationLon +
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

  var checkInStatusDescription;
  if (checkInStatus) {
    checkInStatusDescription = "you have checked in.";
  } else {
    checkInStatusDescription = "you are not checked in.";
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h4>geofence check-in demo</h4>
        <br />
        <label>{checkInStatusDescription} </label>
        <br />
        <button
          className="checkInButton"
          onClick={checkIn}
          disabled={checkInStatus}
        >
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

        <button className="niceButton" onClick={tryLocateByWX}>
          Locate me (by WX)
        </button>
        <label> {vxLocationDescription}</label>
        <br />
        <button className="niceButton" onClick={tryLocateByH5}>
          Locate me (by H5)
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
          go within {checkInDistance.toLocaleString()} metres of target location
          to check in.
        </p>
        <br />
      </header>
    </div>
  );
}
export default App;

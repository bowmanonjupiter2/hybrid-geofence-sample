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
  const [selectDateTime, setSelectDateTime] = useState(moment());
  const [checkInStatus, setCheckInStatus] = useState(
    false
  );

  const [checkInDistance, setCheckInDistance] = useState(500);

  const [isVXLocatingInProgress, setIsVXLocatingInProgress] = useState(false);
  const [isVXLocationAcquired, setIsVXLocationAcquired] = useState(false);
  const [vxUserLocationLat, setVXUserLocationLat] = useState(null);
  const [vxUserLocationLon, setVXUserLocationLon] = useState(null);

  const [isH5LocatingInProgress, setIsH5LocatingInProgress] = useState(false);
  const [isH5LocationAcquired, setIsH5LocationAcquired] = useState(false);
  const [h5UserLocationLat, setH5UserLocationLat] = useState(null);
  const [h5UserLocationLon, setH5UserLocationLon] = useState(null);



  function isWeiXinBrowser() {
    var agent = navigator.userAgent.toLocaleLowerCase();

    if (agent.match(/MicroMessenger/i) == "micromessenger") {
      return true;
    } else {
      return false;
    }
  }

  async function tryLocateByVX() {
    setIsVXLocatingInProgress(true);
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
        console.log("weixin js sdk config ready, start to request location");
        wx.getLocation({
          type: "gcj02",
          success: function (res) {
            setVXUserLocationLat(res.latitude);
            setVXUserLocationLon(res.longitude);
            setIsVXLocationAcquired(true);
            setIsVXLocatingInProgress(false);
          },
        });
      });
      wx.error(function (res) {
        setIsVXLocationAcquired(false);
        setIsVXLocatingInProgress(false);
        console.log("weixin js sdk config failure:", res);
        console.log("try switch to use H5 geolocation");
        tryLocateByH5();
      });
    } catch (e) {
      setIsVXLocationAcquired(false);
      setIsVXLocatingInProgress(false);
      console.log("get weixin signature failure:", e);
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
    if (isVXLocationAcquired || isH5LocationAcquired) {
      checkIn();
    }
  }, [isH5LocationAcquired, isVXLocationAcquired]);

  function checkIn() {

    if(checkInStatus) {
      return;
    }

    if (moment() < selectDateTime) {
      alert("please only check in after the specified date/time");
      return;
    }

    if (isVXLocatingInProgress || isH5LocatingInProgress) {
      console.log("locating in progress, ignore this check in");
      return;
    } else {
      console.log("start locating user position...");
      if (isWeiXinBrowser()) {
        console.log("user is using weixin browser");
        tryLocateByVX();
      } else {
        console.log("user is not using weixin browser");
        tryLocateByH5();
      }
    }

    if (!isH5LocationAcquired && !isVXLocationAcquired) {
      console.log("no location data, skip this check in")
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
      setCheckInStatus(true);
      alert("user has checked in the party");
      console.log("user has checked in the party")
    } else {
      alert(
        "Sorry, you are too far away from the party location by " +
          userDistanceToNearestParty +
          " metres"
      );
      setCheckInStatus(false);
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

  var checkInStatusDescription;
  if(checkInStatus) {
    checkInStatusDescription = "you have checked in."
  } else {
    checkInStatusDescription = "you are not checked in."
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h4>eTicket geofence check-in demo</h4>
        <br />
        {/* disabled={!isH5LocationAcquired && !isVXLocationAcquired}  */}

        <label>{checkInStatusDescription} </label>
        <br/>
        <button className="checkInButton" onClick={checkIn} disabled={checkInStatus}>
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

        <button className="niceButton" onClick={tryLocateByVX}>
          Locate me (WeiXin)
        </button>
        <label> {vxLocationDescription}</label>
        <br />
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
          go within {checkInDistance.toLocaleString()} metres of target location
          to check in.
        </p>
        <br />
      </header>
    </div>
  );
}
export default App;

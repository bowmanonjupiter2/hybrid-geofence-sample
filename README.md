This example demonstrates checking in a user on a specified date time and location (within a specified distance). The location coordinates are for testing purpose hardcoded.

the locations service is hybrid solutions :
h5 geolocation
weixin js sdk location api

check-in logic flow
1. check the date and time is after the specified date and time otherwise reject
2. when 1# passed then check if it is embedded browser of weixin if yes then use weixin js sdk location api (authentication required)
3. otherwise 
    3.1 call h5 geolocation 
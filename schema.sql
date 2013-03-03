CREATE TABLE trucks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    twitterName VARCHAR(255),
    twitterid BIGINT,
    phone VARCHAR(20),
    lastSeen timestamp without time zone,
    open boolean,
    currLocationId INTEGER NOT NULL REFERENCES locations(locationid)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    pass CHAR(256) NOT NULL,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE vendors (
    userid INTEGER NOT NULL REFERENCES users(id),
    truckid INTEGER NOT NULL REFERENCES trucks(id)
);

CREATE TABLE locations (
    locationid SERIAL PRIMARY KEY,
    geoPoint GEOGRAPHY(Point),
    textLoc VARCHAR(255)
);

CREATE TABLE follows (
    userid INTEGER NOT NULL REFERENCES users(id),
    truckid INTEGER NOT NULL REFERENCES trucks(id)
);

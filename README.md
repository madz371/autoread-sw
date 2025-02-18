### Installation & Run

Make sure the configuration and server meet the requirements so that there are no problems during installation or when this bot is running, type this on your console (linux) :

```
$ bash install.sh
```

to run in it, type this :

```
$ pm2 start pm2.config.js
```

### Requirements

- [x] NodeJS >= 18 (Recommended v20)
- [x] FFMPEG
- [x] Server vCPU/RAM 1/2GB (Min)

### Server

- [x] NAT VPS [Hostdata](https://hostdata.id/nat-vps-usa/) (Recommended)
- [x] Hosting Panel [Voxy Host](https://voxyhost.com/)
- [x] VPS [OVH Hosting](https://www.ovhcloud.com/asia/vps/)
- [x] RDP Windows [RDP Win](https://www.rdpwin.com/rdpbot.php)

### Cloud Database

- [x] PostgreSQL [Supabase](https://supabase.com/pricing) ~ [Setup Tutorial](https://youtu.be/kdyF7cP9E7k?si=YjlxI5OMHBdkSxkw) (Recommended)
- [x] PostgreSQL [Cockroach](https://cockroachlabs.cloud/) (Recommended)
- [x] PostgreSQL [Aiven](https://aiven.io) ~ Remove ```?sslmode=required```
- [x] MongoDB [MongoDB](https://www.mongodb.com) ~ [Setup Tutorial](https://youtu.be/-9lfyWz0SdE?si=nmyA6qeBYKbO4R45) (Recommended)

### Pairing Code

Connecting account without qr scan but using pairing code.

```Javascript
{
   "pairing": {
      "state": true, // "true" if you want to use the pairing code
      "number": 62xxxx // start number with country code
   }
}
```
### Configuration

There are 2 configuration files namely ```.env``` and ```config.json```, adjust them before installing.

```Javascript
{
   "owner": "628XXXX",
   "owner_name": "Owner Name",
   "database": "data",
   "ram_limit": "900mb",
   "cooldown": 3, // anti spam hold 3 seconds
   "timer": 180000,
   "timeout": 1800000,
   "permanent_threshold": 3,
   "notify_threshold": 4,
   "banned_threshold": 5,
   "blocks": ["994", "91", "92"],
   "evaluate_chars":  ["=>", "~>", "<", ">", "$"],
   "pairing": {
      "state": true, // "true" if you want to use the pairing code
      "number": 62xxxx // start number with country code
   }
}
```

```### Database : https://www.mongodb.com/
DATABASE_URL = ''

### Timezone (Important)
TZ = 'Asia/Jakarta'
```

**Notes** :
+ ```ram_limit``` : ram usage limit, for example you have a server with 1gb of ram set before the maximum capacity is 900mb.

+ ```DATABASE_URL``` : can be filled with mongo and postgresql URLs to use localdb just leave it blank and the data will be saved to the .json file.

> Localdb is only for development state, for production state you must use a cloud database (mongo / postgres)

### High Level Spam Detection

This program is equipped with a spam detector (anti-spam) which is very sensitive.

### Run on Heroku

To run this bot on Heroku you only need to add 2 buildpacks and choose region EU (EUROPE) for your app :

+ NodeJS
+ FFMPEG [https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git](https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git)


delete the `package.json`, and rename `package-for-heroku.json` to `package.json`

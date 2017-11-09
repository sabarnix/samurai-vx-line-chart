const data = `{
    "dates": [
      "2017-10-23T07:00:00.000Z",
      "2017-10-23T08:00:00.000Z",
      "2017-10-23T09:00:00.000Z",
      "2017-10-23T10:00:00.000Z",
      "2017-10-23T11:00:00.000Z",
      "2017-10-23T12:00:00.000Z",
      "2017-10-23T13:00:00.000Z"
    ],
    "axes": [
      "Impressions Delivered",
      "Bid Price"
    ],
    "charts": [
      {
        "title": "Hometalk",
        "series": [
          {
            "label": "Impressions Delivered",
            "data": [
              39491,
              91867,
              150207,
              268489,
              362684,
              313877,
              248081
            ],
            "axis": 0
          },
          {
            "label": "Bid Price",
            "data": [
              51.95,
              121.33,
              191.69,
              338.06,
              445.86,
              400.19,
              310.2
            ],
            "axis": 1
          }
        ]
      },
      {
        "title": "Intermarkets - HB",
        "series": [
          {
            "label": "Impressions Delivered",
            "data": [
              58012,
              118847,
              133289,
              164113,
              203564,
              219416,
              141983
            ],
            "axis": 0
          },
          {
            "label": "Bid Price",
            "data": [
              45.22,
              100.13,
              120.51,
              198.48,
              231.56,
              241.63,
              175.2
            ],
            "axis": 1
          }
        ]
      },
      {
        "title": "Forbes PE Project",
        "series": [
          {
            "label": "Impressions Delivered",
            "data": [
              31797,
              68381,
              88458,
              146784,
              201344,
              229803,
              152698
            ],
            "axis": 0
          },
          {
            "label": "Bid Price",
            "data": [
              124.17,
              291.71,
              411.65,
              659.42,
              859.63,
              953.64,
              636.46
            ],
            "axis": 1
          }
        ]
      }
    ]
  }`;
export default JSON.parse(data);

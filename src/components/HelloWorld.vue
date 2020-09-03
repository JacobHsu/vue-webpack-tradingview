<template>
  <div class="">
    <div class="main">
      <div class="center">
        <div class="symbol">
          <div class="item">
            <!-- <Icon v-if="currentCoinIsFavor" type="ios-star" color="#f0a70a" size="24" />
            <Icon v-else type="ios-star-outline" color="#f0a70a" size="24" /> -->
          </div>
          <div class="item" style="margin-left: -40px;">
            <span class="coin"
              >{{ currentCoin.coin }}
              <small>/{{ currentCoin.base }}</small>
            </span>
          </div>
          <div class="item">
            <span class="text">{{ $t("service.NewPrice") }}</span>
            <span
              class="num"
              :class="{
                buy: currentCoin.change > 0,
                sell: currentCoin.change < 0
              }"
              >{{ currentCoin.close | toFixed(baseCoinScale) }}</span
            >
            <span class="price-cny"
              >≈ ￥{{ (currentCoin.usdRate * CNYRate) | toFixed(2) }}</span
            >
          </div>
          <div class="item">
            <span class="text">{{ $t("service.Change") }}</span>
            <span
              class="num"
              :class="{
                buy: currentCoin.change > 0,
                sell: currentCoin.change < 0
              }"
              >{{ currentCoin.rose }}</span
            >
          </div>
          <div class="item">
            <span class="text">{{ $t("service.high") }}</span>
            <span class="num ">{{
              currentCoin.high | toFixed(baseCoinScale)
            }}</span>
          </div>
          <div class="item">
            <span class="text">{{ $t("service.low") }}</span>
            <span class="num ">{{
              currentCoin.low | toFixed(baseCoinScale)
            }}</span>
          </div>
          <div class="item">
            <span class="text">{{ $t("service.ExchangeNum") }}</span>
            <span class="num "
              >{{ currentCoin.volume }} {{ currentCoin.coin }}</span
            >
          </div>
          <div class="item"></div>
        </div>
        <div class="imgtable">
          <div class="handler">
            <span
              @click="changeImgTable('k')"
              :class="{ active: currentImgTable === 'k' }"
              >{{ $t("exchange.kline") }}</span
            >
            <span
              @click="changeImgTable('s')"
              :class="{ active: currentImgTable === 's' }"
              >{{ $t("exchange.depth") }}</span
            >
          </div>
          <div
            id="kline_container"
            :class="{ hidden: currentImgTable === 's' }"
          ></div>
          <DepthGraph
            :class="{ hidden: currentImgTable === 'k' }"
            ref="depthGraph"
          ></DepthGraph>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Datafeeds from "@js/charting_library/datafeed/bitrade.js";
var Stomp = require("stompjs");
var SockJS = require("sockjs-client");

import DepthGraph from "@components/exchange/DepthGraph.vue";
import * as $ from "@js/jquery.min.js";

export default {
  components: { DepthGraph },
  data() {
    let self = this;
    return {
      collecRequesting: false,
      currentCoinIsFavor: false,
      isUseBHB: false,
      skin: "night", //皮肤样式day&night
      currentImgTable: "k",
      selectedOrder: "current", //当前显示的委托记录
      selectedPlate: "all", //当前显示的买卖盘
      CNYRate: null,
      datafeed: null,
      defaultPath: "btc_usdt",
      basecion: "usdt",
      coinScale: 6,
      baseCoinScale: 6,
      symbolFee: 0.001,
      dataIndex: [],
      dataIndex2: [],
      searchKey: "",
      coinInfo: {},
      currentCoin: {
        base: "",
        coin: "",
        symbol: ""
      },
      publishType: "NONE",
      currentTime: 0,
      publishAmount: 0,
      publishPrice: 0,
      startTime: "2000-01-01 00:00:00",
      endTime: "2000-01-01 00:00:00",
      clearTime: "2000-01-01 00:00:00",
      showPublish: false,
      showCountDown: false,
      countDownBgColor: "#003478",
      publishState: 0,
      //当前市场上的交易币种，按交易对分
      coins: {
        _map: [],
        USDT: []
      },
      form: {
        buy: {
          limitPrice: 0.0,
          limitAmount: 0.0,
          marketAmount: 0.0,
          limitTurnover: 0.0
        },
        sell: {
          limitPrice: 0.0,
          limitAmount: 0.0,
          marketAmount: 0.0,
          limitTurnover: 0.0
        }
      }
    };
  },
  watch: {
    $route(to, from) {
      this.init();
    }
  },
  created: function() {
    this.init();
  },
  methods: {
    init() {
      // var params = this.$route.params.pair;
      // if (params == undefined) {
      //   this.$router.push("/exchange/" + this.defaultPath);
      //   params = this.defaultPath;
      // }
      var params = "btc_usdt";
      const basecion = params.split("_")[1];
      if (basecion) {
        this.basecion = basecion;
      }
      var coin = params.toUpperCase().split("_")[0];
      var base = params.toUpperCase().split("_")[1];
      this.currentCoin.symbol = coin + "/" + base;

      this.getSymbol(); //包含 K线图、getFavor、startWebsock等
    },
    changeImgTable(str) {
      this.currentImgTable = str;
    },
    getCoin(symbol) {
      return this.coins._map[symbol];
    },
    getKline() {
      var that = this;
      let config = {
        autosize: true,
        height: 320,
        fullscreen: true,
        symbol: that.symbol,
        interval: "60", // 默认K线周期
        timezone: "Asia/Shanghai",
        toolbar_bg: "#18202a",
        container_id: "kline_container",
        datafeed: that.datafeed,
        library_path:
          process.env.NODE_ENV === "production"
            ? "/assets/charting_library/"
            : "/src/assets/js/charting_library/",
        locale: "zh",
        debug: false,
        drawings_access: {
          type: "black",
          tools: [{ name: "Regression Trend" }]
        },
        disabled_features: [
          "header_resolutions",
          "timeframes_toolbar",
          "header_symbol_search",
          "header_chart_type",
          "header_compare",
          "header_undo_redo",
          "header_screenshot",
          "header_saveload",
          "use_localstorage_for_settings",
          "left_toolbar",
          "volume_force_overlay"
        ],
        enabled_features: [
          "hide_last_na_study_output",
          "move_logo_to_main_pane"
        ],
        custom_css_url: "bundles/common.css",
        supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
        charts_storage_url: "http://saveload.tradingview.com",
        charts_storage_api_version: "1.1",
        client_id: "tradingview.com",
        user_id: "public_user_id",
        overrides: {
          "paneProperties.background": "#1B1E2E",
          "paneProperties.vertGridProperties.color": "rgba(0,0,0,.1)",
          "paneProperties.horzGridProperties.color": "rgba(0,0,0,.1)",
          //"scalesProperties.textColor" : "#AAA",
          "scalesProperties.textColor": "#61688A",
          "mainSeriesProperties.candleStyle.upColor": "#00b275",
          "mainSeriesProperties.candleStyle.downColor": "#f15057",
          "mainSeriesProperties.candleStyle.drawBorder": false,
          "mainSeriesProperties.candleStyle.wickUpColor": "#589065",
          "mainSeriesProperties.candleStyle.wickDownColor": "#AE4E54",
          "paneProperties.legendProperties.showLegend": false,

          "mainSeriesProperties.areaStyle.color1": "rgba(71, 78, 112, 0.5)",
          "mainSeriesProperties.areaStyle.color2": "rgba(71, 78, 112, 0.5)",
          "mainSeriesProperties.areaStyle.linecolor": "#9194a4",
          volumePaneSize: "small"
        },
        time_frames: [
          {
            text: "1min",
            resolution: "1",
            description: "realtime",
            title: that.$t("exchange.realtime")
          },
          { text: "1min", resolution: "1", description: "1min" },
          { text: "5min", resolution: "5", description: "5min" },
          { text: "15min", resolution: "15", description: "15min" },
          { text: "30min", resolution: "30", description: "30min" },
          {
            text: "1hour",
            resolution: "60",
            description: "1hour",
            title: "1hour"
          },
          /*{ text: "4hour", resolution: "240", description: "4hour",title: "4hour" },*/
          {
            text: "1day",
            resolution: "1D",
            description: "1day",
            title: "1day"
          },
          {
            text: "1week",
            resolution: "1W",
            description: "1week",
            title: "1week"
          },
          { text: "1mon", resolution: "1M", description: "1mon" }
        ]
      };
      if (that.skin === "day") {
        config.toolbar_bg = "#fff";
        config.custom_css_url = "bundles/common_day.css";
        config.overrides["paneProperties.background"] = "#fff";
        config.overrides["mainSeriesProperties.candleStyle.upColor"] =
          "#a6d3a5";
        config.overrides["mainSeriesProperties.candleStyle.downColor"] =
          "#ffa5a6";
      }
      require(["@js/charting_library/charting_library.min.js"], function(tv) {
        console.log(4, tv, config);
        var widget = (window.tvWidget = new TradingView.widget(config));
        widget.onChartReady(function() {
          widget.chart().executeActionById("drawingToolbarAction");
          widget
            .chart()
            .createStudy("Moving Average", false, false, [5], null, {
              "plot.color": "#EDEDED"
            });
          widget
            .chart()
            .createStudy("Moving Average", false, false, [10], null, {
              "plot.color": "#ffe000"
            });
          widget
            .chart()
            .createStudy("Moving Average", false, false, [30], null, {
              "plot.color": "#ce00ff"
            });
          widget
            .chart()
            .createStudy("Moving Average", false, false, [60], null, {
              "plot.color": "#00adff"
            });
          widget
            .createButton()
            .attr("title", "realtime")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(3);
              widget.setSymbol("", "1");
            })
            .append("<span>分时</span>");

          widget
            .createButton()
            .attr("title", "M1")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "1");
            })
            .append("<span>M1</span>");

          widget
            .createButton()
            .attr("title", "M5")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "5");
            })
            .append("<span>M5</span>");

          widget
            .createButton()
            .attr("title", "M15")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "15");
            })
            .append("<span>M15</span>");

          widget
            .createButton()
            .attr("title", "M30")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "30");
            })
            .append("<span>M30</span>");

          widget
            .createButton()
            .attr("title", "H1")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "60");
            })
            .append("<span>H1</span>")
            .addClass("selected");

          widget
            .createButton()
            .attr("title", "D1")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "1D");
            })
            .append("<span>D1</span>");

          widget
            .createButton()
            .attr("title", "W1")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "1W");
            })
            .append("<span>W1</span>");

          widget
            .createButton()
            .attr("title", "M1")
            .on("click", function() {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(1);
              widget.setSymbol("", "1M");
            })
            .append("<span>M1</span>");
        });
      });
    },
    getSymbol() {
      this.$http.post(this.host + this.api.market.thumb, {}).then(response => {
        var resp = response.body;
        //先清空已有数据
        for (var i = 0; i < resp.length; i++) {
          var coin = resp[i];
          coin.base = resp[i].symbol.split("/")[1];
          this.coins[coin.base] = [];
          this.coins[coin.base + "2"] = [];
          this.coins._map = [];
          this.coins.favor = [];
        }
        for (var i = 0; i < resp.length; i++) {
          var coin = resp[i];
          coin.price = resp[i].close = resp[i].close.toFixed(
            this.baseCoinScale
          );
          coin.rose =
            resp[i].chg > 0
              ? "+" + (resp[i].chg * 100).toFixed(2) + "%"
              : (resp[i].chg * 100).toFixed(2) + "%";
          coin.coin = resp[i].symbol.split("/")[0];
          coin.base = resp[i].symbol.split("/")[1];
          coin.href = (coin.coin + "_" + coin.base).toLowerCase();
          coin.isFavor = false;
          this.coins._map[coin.symbol] = coin;
          if (coin.zone == 0) {
            this.coins[coin.base].push(coin);
          } else {
            this.coins[coin.base + "2"].push(coin);
          }
          if (coin.symbol == this.currentCoin.symbol) {
            this.currentCoin = coin;
            this.form.buy.limitPrice = this.form.sell.limitPrice = coin.price;
          }
        }

        // require(["../../assets/js/exchange.js"], function(e) {
        //   e.clickScTab();
        // });
        this.startWebsock();
        // this.changeBaseCion(this.basecion);
      });
    },
    startWebsock() {
      if (this.stompClient) {
        this.stompClient.ws.close();
      }
      var stompClient = null;
      var that = this;
      var socket = new SockJS(that.host + that.api.market.ws);
      stompClient = Stomp.over(socket);
      this.stompClient = stompClient;
      stompClient.debug = false;
      // this.datafeed = new Datafeeds.WebsockFeed(that.host+'/market',this.currentCoin,stompClient);
      // this.getKline();
      stompClient.connect({}, function(frame) {
        that.datafeed = new Datafeeds.WebsockFeed(
          that.host + "/market",
          that.currentCoin,
          stompClient,
          that.baseCoinScale
        );
        that.getKline();
        //订阅价格变化消息
        stompClient.subscribe("/topic/market/thumb", function(msg) {
          var resp = JSON.parse(msg.body);
          var coin = that.getCoin(resp.symbol);
          if (coin != null) {
            // coin.price = resp.close.toFixed(2);
            coin.price = resp.close;
            coin.rose =
              resp.chg > 0
                ? "+" + (resp.chg * 100).toFixed(2) + "%"
                : (resp.chg * 100).toFixed(2) + "%";
            // coin.close = resp.close.toFixed(2);
            // coin.high = resp.high.toFixed(2);
            // coin.low = resp.low.toFixed(2);
            coin.close = resp.close;
            coin.high = resp.high;
            coin.low = resp.low;
            coin.turnover = parseInt(resp.volume);
            coin.volume = resp.volume;
            coin.usdRate = resp.usdRate;
          }
        });
      });
    }
    /**
     *
     */
  }
};
</script>

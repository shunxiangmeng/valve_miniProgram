// pages/valve/valve.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

    list: [],
    bluetoothListBKColor: 'white',   //
    isBlueConnect: false,
    connectBlueId: '',
    serviceId: '',
    characteristicId: '',
    loadingHidden: true,

    valveId: "",

    status: "",
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("loading");
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 初始化蓝牙设备
   */
  onReady: function () {
    wx.openBluetoothAdapter({

      success: function (res) {
        console.log("blue init ok");
      },

      fail(res) 
      {
        console.log("blue init error");
      },

      complete(res) 
      {
        wx.onBluetoothAdapterStateChange(function (res) 
        {
          if (res.avalible)
          {
            this.searchBluetooth();
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("下拉");
    var that = this;
    that.setData({
    //  list: [],
    })
    wx.stopPullDownRefresh()

    this.searchBluetooth();
    //this.getBluetoothList();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

//==========================================================================================
  getBluetoothList: function () {
    var that = this;
    wx.getBluetoothDevices({
      success: function (res) {
        console.log(res)
        if (res.devices[0]) {
          //console.log(ab2hex(res.devices[0].advertisData))
          console.log(res);
          that.setData({
            list: res.devices,
          })
        }
      }
    })
  },

  /*********************************************************************************
  *search bluetooth
  */
  searchBluetooth: function(){
    var that = this;
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey:false,
      success(res)
      {
        wx.onBluetoothDeviceFound(res => {

          for (let i = 0; i < that.data.list.length; i++)
          {
            if (that.data.list[i].deviceId == res.devices[0].deviceId)
            {
              //console.log("res.devices[0].deviceId", res.devices[0].deviceId);
              return;
            }
          }
          if (res.devices[0].name == "" || res.devices[0].name[0] != 'B')
          {
            res.devices[0].name = "未知设备";
            return;
          }
          that.setData({
            list: that.data.list.concat(res.devices[0]),
          })
        })
      },

      fail(res){
        console.log(res);
      }
    })
  },

//=======================================================================================
//蓝牙连接状态
  onBluetoothConnect: function(obj)
  {
    var that = obj;
    wx.onBLEConnectionStateChange(function (res) 
    {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      if (res.connected == true) {
        that.setData({
          bluetoothListBKColor: 'green',
          isBlueConnect: true,
          connectBlueId: res.deviceId,
        })
    
        wx.showToast({
          title: '连接蓝牙成功',
          icon: 'succes',
          duration: 1000,
          mask: true
        })
      }
      else {
        that.setData({
          bluetoothListBKColor: 'white',
          isBlueConnect: false,
          connectBlueId: '',
        })

        wx.showToast({
          title: '断开蓝牙连接',
          icon: 'succes',
          duration: 1000,
          mask: true
        })
      }
    })

  },

//解析收到的数据
  paserReceiveData: function(buffer)
  {
    var dataView = new DataView(buffer);
    var bufLen = dataView.byteLength;
    var obj = new Object();

    obj.cmd = dataView.getInt8(1);
    obj.len = dataView.getUint8(2);

    if (bufLen < obj.len + 5)
    {
      return null;
    }

    obj.dataHex = [];
    obj.ret = dataView.getUint8(3);;
    var temp = "";
    for (var i = 0; i < obj.len; i++)
    {
      obj.dataHex[i] = dataView.getUint8(3+i+1);
      temp += String.fromCharCode(obj.dataHex[i]);
    }

    obj.dataStr = temp;

    return obj;
  },

  // ArrayBuffer转16进度字符串示例
  ab2hex: function(buffer) 
  {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) 
      {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
  return hexArr.join('');
  },
//===============================================================================================
//监听蓝牙接收数据
onBluetoothReceiveData: function(obj)
{
  var that = this;
  //console.log("receive");
  wx.onBLECharacteristicValueChange(function (res) 
  {
    //console.log('characteristic value comed:', res.value[0])
    console.log(that.ab2hex(res.value));

    var dataView = new DataView(res.value);
    var rx = that.paserReceiveData(res.value);
    console.log("rx:", rx);

    if (rx == null)
    {
      return;
    }

    switch(rx.cmd)
    {
      case 0x1A: 
        console.log("0x1A ID:", rx.dataStr);
        that.setData({valveId: rx.dataStr,})
        wx.showToast({
          title: '获取阀门ID成功',
          icon: 'succes',
          duration: 1000,
          mask: true
        })
      break;

      case 0x3A:
        console.log("0x3A ID:", rx.dataStr);
        if (rx.dataHex[0] == 0x00)
        {
          wx.showToast({
            title: '写入有效日期成功',
            icon: 'succes',
            duration: 1000,
            mask: true
          })
        }
        break;

      case 0x4A:  //重置密码
        wx.showToast({
          title: '修改密码再操作',
          icon: 'loading',
          duration: 1000,
          mask: true
        })
        break;

      case 0x5A:
        if (rx.ret == 0x00)
        {
          wx.showToast({
            title: '修改密码成功',
            icon: 'succes',
            duration: 1000,
            mask: true
          })
        }
        else if (rx.ret == 0x01)
        {
          wx.showToast({
            title: '原始密码错误',
            icon: 'loading',
            duration: 1000,
            mask: true
          })
        }
        break;

      default:
        console.log("default:", rx.cmd);
      break;


    }

  })

},

//===============================================================================================
//连接蓝牙
  bluetoothConnect: function(e)
  {
    var that = this;
    if (that.data.isBlueConnect == false)
    {
      wx.createBLEConnection({
        deviceId: e.currentTarget.dataset.deviceid,
        success: function (res) 
        {
          //监听蓝牙连接状态
          that.onBluetoothConnect(that);
          //监听接收数据
          that.onBluetoothReceiveData(that);
        },

        fail: function(res)
        {
          console.log(res);
        },

        complete: function(res)
        {
          //console.log("connect complete:",res);
          wx.getBLEDeviceServices({
            deviceId: e.currentTarget.dataset.deviceid,
            success: function (res) 
            {
              that.data.serviceId = res.services[0].uuid;
              console.log("serviceId:", that.data.serviceId);
            },
            complete: function(res)
            {
              wx.getBLEDeviceCharacteristics({
                deviceId: e.currentTarget.dataset.deviceid,
                serviceId: that.data.serviceId,
                success: function (res) 
                {
                  console.log('characteristicId:', that.data.characteristicId)
                  that.data.characteristicId = res.characteristics[0].uuid;
                },

                fail: function (res) 
                {
                  console.log(res);
                },

                complete: function(res)
                {
                  wx.notifyBLECharacteristicValueChange({
                    deviceId: e.currentTarget.dataset.deviceid,
                    serviceId: that.data.serviceId,
                    characteristicId: that.data.characteristicId,
                    state: true,

                    success: function(res)
                    {
                      //console.log("res:",res);
                    }
                  })

                },

              })
            },
          })
        },
      })
    }
    else
    {
      wx.closeBLEConnection({
        deviceId: e.currentTarget.dataset.deviceid,
        success: function (res) 
        {
        //  console.log(res)
        }
      })
    }

  },

//=================================================================
getCheckSum: function(buf, len)
{
  var chksum = 0;
  for (var i = 0; i < len; i++)
  {
    chksum += buf[i];
  }
  return chksum;
},

//=================================================================
  makeTxData: function(cmd, data1, data2, data3, len)
  {
    var bufLen = len+5;
    var buffer = new ArrayBuffer(bufLen);
    var dataView = new DataView(buffer);
    var count = 0;
    var data1Len = 0;
    var data2Len = 0;
    var data3Len = 0;
    var chksum = 0;

    if (data1 != null)
    {
      data1Len = data1.length;
    }
    if (data2 != null) 
    {
      data2Len = data2.length;
    }
    if (data3 != null) 
    {
      data3Len = data3.length;
    }

    dataView.setUint8(0, 0x40);
    dataView.setUint8(1, cmd);  //cmd
    dataView.setUint8(2, len);  //len
    chksum += Number(0x40);
    chksum += Number(cmd);
    chksum += Number(len);

    count = 3;
    for (var i = 0; i < data1Len; i++)
    {
      dataView.setUint8(count, data1.charCodeAt(i));
      chksum += data1.charCodeAt(i);
      count += 1;
    }

    for (var i = 0; i < data2Len; i++) 
    {
      dataView.setUint8(count, data2.charCodeAt(i));
      chksum += data2.charCodeAt(i);
      count += 1;
    }

    for (var i = 0; i < data3Len; i++) {
      dataView.setUint8(count, data3.charCodeAt(i));
      console.log(data3.charCodeAt(i));
      chksum += data3.charCodeAt(i);
      count += 1;
    }

    dataView.setUint8(count, chksum);  //checksum
    count += 1;
    dataView.setUint8(count, 0x23);
    return buffer;
  },


  sendBleCmd: function(cmd, data1, data2, data3, len)
  {
    var that = this;
    var buffer = this.makeTxData(cmd, data1, data2, data3, len);

    wx.writeBLECharacteristicValue({
      deviceId: that.data.connectBlueId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: that.data.serviceId,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: that.data.characteristicId,
      // 这里的value是ArrayBuffer类型
      value: buffer,
      success: function (res) {
        //console.log('writeBLECharacteristicValue success', res.errMsg)
      },

      complete: function (res) {
        wx.readBLECharacteristicValue({
          // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接  [**new**]
          deviceId: that.data.connectBlueId,
          // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
          serviceId: that.data.serviceId,
          // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
          characteristicId: that.data.characteristicId,
          success: function (res) {
            //console.log('readBLECharacteristicValue:', res.errCode)
          }
        })
      }
    })
  },
//=========================================================================================
//获取阀门ID
  getValveID: function(e)
  {
    this.sendBleCmd(0x1A, "823492", null, null, 6);
    wx.showToast({
      title: '获取阀门ID',
      icon: 'loading',
      duration: 10000,
      mask: true
    })
  },

//写有效日期
  writeValveDate: function(e)
  {
    this.sendBleCmd(0x3A, "202206", "823492", this.data.valveId, 18);
  },

  //修改密码
  setPassword: function () 
  {
    this.sendBleCmd(0x5A, "000000", "777777", null, 12);
  },


})
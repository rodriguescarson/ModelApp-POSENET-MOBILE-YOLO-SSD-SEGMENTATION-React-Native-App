import React, { Component } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native'
import { Button } from 'react-native-elements'
import LinearGradient from 'react-native-linear-gradient'
import Tflite from 'tflite-react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import Icon from 'react-native-vector-icons/FontAwesome'
const mobile = "MobileNet"
const ssd = "SSD MobileNet"
const yolo = "Tiny YOLOv2"
const deeplab = "Deeplab"
const posenet = "PoseNet"

let tflite = new Tflite();
const height = 350
const width = 350
export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      model: null,
      source: null,
      recognitions: [],
      imageHeight: height,
      imageWidth: width
    }
  }

  onSelectImage() {
    const options = {}
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User canceled image picker')
      }
      else if (response.error) {
        console.log(response.error)
      } else if (response.customButton) {
        console.log('User click custom button')
      } else {
        path = response.assets[0].uri
        console.log(path)
        this.setState({ source: { uri: response.assets[0].uri } })

        switch (this.state.model) {
          case ssd:
            tflite.detectObjectOnImage({
              path: path,
              threshold: 0.2,
              numResultPerClass: 1,
            }, (err, res) => {
              if (err) console.log(err)
              else {
                console.log(res)
                this.setState({ recognitions: res })
              }
            })
            break
          case yolo:
            tflite.detectObjectOnImage({
              path: path,
              model: 'YOLO',
              threshold: 0.2,
              imageMean: 0.0,
              imageStd: 255,
              threshold: 0.4,
              numResultPerClass: 1
            }, (err, res) => {
              if (err) console.log(err)
              else {
                console.log(res)
                this.setState({ recognitions: res })
              }
            })
            break
          case deeplab:
            tflite.runSegmentationOnImage({
              path: path
            }, (err, res) => {
              if (err) console.log(err)
              else {
                console.log(res)
                this.setState({ recognitions: res })
              }
            })
            break
          case posenet:
            tflite.runPoseNetOnImage({
              path: path,
              threshold: 0.2,
            }, (err, res) => {
              if (err) console.log(err)
              else {
                console.log(res)
                this.setState({ recognitions: res })
              }
            })
            break
          default:
            tflite.runModelOnImage({
              path: path,
              threshold: 0.05,
              imageMean: 128.0,
              imageStd: 128.0,
              threshold: 0.05
            }, (err, res) => {
              if (err) console.log(err)
              else {
                console.log(res)
                this.setState({ recognitions: res })
              }
            })
            break
        }
      }

    })
  }

  onSelectModel(model) {
    this.setState({ model })
    switch (model) {
      case ssd:
        var model = 'models/ssd_mobilenet.tflite'
        var labelFile = 'models/ssd_mobilenet.txt'
        break
      case yolo:
        var model = 'models/yolov2_tiny.tflite'
        var labelFile = 'models/yolov2_tiny.txt'
        break
      case deeplab:
        var model = 'models/deeplabv3_257_mv_gpu.tflite'
        var labelFile = 'models/deeplabv3_257_mv_gpu.txt'
        break
      case posenet:
        var model = 'models/posenet_mv1_075_float_from_checkpoints.tflite'
        var labelFile = ''
        break
      default:
        var model = 'models/mobilenet_v1_1.0_224.tflite'
        var labelFile = 'models/mobilenet_v1_1.0_224.txt'
        break
    }
    tflite.loadModel({
      model: model,
      labels: labelFile
    },
      (err, res) => {
        if (err) { console.log(err) } else { console.log(res) }
      })
  }
  goBack() {
    this.setState({ source: null })
    this.setState({ recognitions: [] })
    this.setState({ model: null })
  }
  renderResults() {
    const { model, recognitions, imageHeight, imageWidth } = this.state
    switch (model) {
      case ssd:
      case yolo:
        console.log(recognitions)
        return recognitions.map((res, id) => {
          var left = res['rect']['x'] * imageWidth
          var top = res['rect']['y'] * imageHeight
          var width = res['rect']['w'] * imageWidth
          var height = res['rect']['h'] = imageHeight
          return (
            <View key={id} style={[styles.box, { top, left, width, height }]}>
              <Text
                style={{ color: 'white', backgroundColor: 'red' }}>
                {
                  res['detectedClass'] + ' ' + (res['confidenceInClass'] * 100).toFixed(0) + '%'
                }
              </Text>

            </View>
          )
        })
      case deeplab:
        var base64image = `data:image/png;base64,${recognitions}`
        return recognitions.length > 0 ? <View><Image source={{ uri: base64image }} style={styles.imageOutput}></Image></View >
          : undefined
      case posenet:
        return recognitions.map((res, id) => {
          return Object.values(res["keypoints"]).map((k, id) => {
            var left = k["x"] * imageWidth - 12;
            var top = k["y"] * imageHeight - 12;
            var width = imageWidth;
            var height = imageHeight;
            return (
              <View key={id} style={{ position: 'absolute', top, left, width, height }}>
                <Text style={{ color: 'blue', fontSize: 12 }}>
                  {"● "}
                </Text>
              </View>
            )
          });
        });
      default:
        return recognitions.map((res, id) => {
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text key={id + 11} style={{ color: 'black', fontSize: 16 }}>
                {res['label'] + '-' + (res['confidence'] * 100).toFixed(0) + '%'}
              </Text>
            </View>
          )
        })
    }
  }
  render() {
    const { model, source, recognitions } = this.state
    var renderButton = (m) => {
      return (
        <Button title={m} buttonStyle={styles.button} onPress={this.onSelectModel.bind(this, m)}></Button>
      )
    }
    return (
      <LinearGradient colors={['#fffc00', '#ffff70']} style={styles.linearGradient} >
        {model ? <View>
          {<Icon.Button
            name='undo'
            onPress={this.goBack.bind(this)}
          ></Icon.Button>
          }
          {source ?
            <View>
              <Image source={source} style={styles.imageOutput}></Image>
              {this.renderResults()}
            </View> :
            <Button
              title="Get Image"
              buttonStyle={styles.button}
              onPress={this.onSelectImage.bind(this)}></Button>
          }

        </View> :
          <View>

            {renderButton(mobile)}
            {renderButton(ssd)}
            {renderButton(yolo)}
            {renderButton(deeplab)}
            {renderButton(posenet)}

          </View>
        }
      </LinearGradient>
    )
  }
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    backgroundColor: 'black',
    width: 200,
    height: 50,
    margin: 5
  },
  imageOutput: {
    height: height,
    width: width,
    marginTop: 10
  },
  box: {
    position: 'absolute',
    borderColor: 'red',
    borderWidth: 2
  }
})
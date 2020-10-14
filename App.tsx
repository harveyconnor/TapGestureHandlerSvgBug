import {memoize} from 'lodash';
import React, {createRef} from 'react';
import {View, Dimensions, StyleSheet} from 'react-native';
import {
  State,
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  block,
  cond,
  eq,
  event,
  set,
  multiply,
  add,
  diffClamp,
  useValue,
} from 'react-native-reanimated';
import Svg, {Circle, G, Rect, SvgUri, Text} from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const originalHeight = 1000;
const originalWidth = 2000;
const originalAspectRatio = originalWidth / originalHeight;

export function App() {
  const panRef = createRef<PanGestureHandler>();
  const pinchRef = createRef<PinchGestureHandler>();
  const tapRef = createRef<TapGestureHandler>();

  const scale = useValue(1);
  const scaleOffset = useValue(1);
  const translationX = useValue(0);
  const translationXOffset = useValue(0);
  const translationY = useValue(0);
  const translationYOffset = useValue(0);

  const panHandler = event<PanGestureHandlerGestureEvent>(
    [
      {
        nativeEvent: ({state, translationX: x, translationY: y}) =>
          block([
            set(translationX, add(x, translationXOffset)),
            set(translationY, add(y, translationYOffset)),
            cond(eq(state, State.END), [
              set(translationXOffset, add(translationXOffset, x)),
              set(translationYOffset, add(translationYOffset, y)),
            ]),
          ]),
      },
    ],
    {useNativeDriver: true},
  );

  const pinchHandler = event<PinchGestureHandlerGestureEvent>(
    [
      {
        nativeEvent: ({state, scale: z}) =>
          block([
            cond(eq(state, State.ACTIVE), set(scale, multiply(z, scaleOffset))),
            cond(eq(state, State.END), [
              set(scaleOffset, multiply(scaleOffset, z)),
            ]),
          ]),
      },
    ],
    {useNativeDriver: true},
  );

  const tapHandler = ({nativeEvent}: TapGestureHandlerGestureEvent) => {
    const {state, absoluteX, absoluteY} = nativeEvent;
    if (state === State.ACTIVE) {
      console.log(`Pressed; ${absoluteX}, ${absoluteY}`);
    }
  };

  const minScale = 0.5;
  const maxScale = 3;

  const height = SCREEN_HEIGHT;
  const width = SCREEN_HEIGHT * originalAspectRatio;

  const screenXOffset = SCREEN_WIDTH / 2 - width / 2;
  const screenYOffset = SCREEN_HEIGHT / 2 - height / 2;

  const clampYPadding = SCREEN_HEIGHT / 4;

  const clampX = width / 2 - SCREEN_WIDTH / 2;
  const clampY = height / 2 - SCREEN_HEIGHT / 2 + clampYPadding;

  const getScale = memoize(() => diffClamp(scale, minScale, maxScale));
  const getTranslateX = memoize(() => diffClamp(translationX, -clampX, clampX));
  const getTranslateY = memoize(() => diffClamp(translationY, -clampY, clampY));

  return (
    <View style={styles.root}>
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={panHandler}
        onHandlerStateChange={panHandler}
        minDist={10}
        // avgTouches
        simultaneousHandlers={[pinchRef, tapRef]}
        // minPointers={2}
        // maxPointers={1}
      >
        <Animated.View style={styles.root}>
          <PinchGestureHandler
            ref={pinchRef}
            simultaneousHandlers={[panRef, tapRef]}
            onGestureEvent={pinchHandler}
            onHandlerStateChange={pinchHandler}>
            <Animated.View style={styles.root}>
              <AnimatedSvg
                style={[
                  styles.svg,
                  {
                    transform: [
                      {scale: getScale()},
                      {translateX: getTranslateX()},
                      {translateY: getTranslateY()},
                    ],
                  },
                ]}>
                <G
                  onPress={() => {
                    // for some reason this doesn't fire
                    // I need to get touch events on G so I can group a large number of objects.
                    console.log('G touch event works');
                  }}>
                  <Circle
                    cx={100}
                    cy={100}
                    r={20}
                    fill="black"
                    stroke="white"
                    strokeWidth={5}
                    onPress={() => {
                      // This fires.
                      console.log('Circle Bottom touch event works');
                    }}
                  />
                  <Circle
                    cx={100}
                    cy={100}
                    r={10}
                    fill="lime"
                    onPress={() => {
                      // This fires.
                      console.log('Circle Top touch event works');
                    }}
                  />
                </G>
              </AnimatedSvg>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'blue',
  },
  svg: {
    height: 300,
    width: 300,
    backgroundColor: 'skyblue',
  },
});

export default App;

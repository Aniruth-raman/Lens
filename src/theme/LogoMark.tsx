import { Image, type ImageStyle } from "react-native";

type LogoMarkProps = {
  size?: number;
  style?: ImageStyle;
};

export function LogoMark({ size = 48, style }: LogoMarkProps) {
  return (
    <Image
      source={require("../../assets/brand/logo-mark.png")}
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  );
}

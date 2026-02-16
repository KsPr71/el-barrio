import { Image, ImageProps } from "expo-image";

export function IconImage({ source, ...props }: ImageProps) {
  return (
    <Image
      source={source}
      style={[{ width: 70, height: 70 }, props.style]}
      {...props}
    />
  );
}

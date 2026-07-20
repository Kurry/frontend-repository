import {
  User, Car, Warning, WarningAlt, Cube, Unknown, Tag, View, Apple, Asleep,
  Basketball, Bicycle, Binoculars, Book, Bot, Building, Camera, Cloud, Code,
  Compass, Earth, Education, Fish, Flag, Gift, Home, Idea, Light,
} from '@carbon/icons-react';

export const iconMap = {
  User, Car, Warning, WarningAlt, Cube, Unknown, Tag, View, Apple, Asleep,
  Basketball, Bicycle, Binoculars, Book, Bot, Building, Camera, Cloud, Code,
  Compass, Earth, Education, Fish, Flag, Gift, Home, Idea, Light,
};

export const iconNames = Object.keys(iconMap);

export function ClassIcon({ name, size = 16, ...props }) {
  const Icon = iconMap[name] || Tag;
  return <Icon size={size} {...props} />;
}

import { Text, TouchableOpacity, View } from 'react-native';

import { GLASS_RADIUS } from '@/lib/glassStyles';
import { GlassSurface } from '@/components/shell/GlassSurface';
import { useAuthStyles } from './authStyles';

export function UserTypeCard({
  title,
  description,
  icon,
  active,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  const authStyles = useAuthStyles();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={authStyles.userTypeCardShell}>
      <GlassSurface
        active={active}
        borderRadius={GLASS_RADIUS.card}
        padding={0}
        contentStyle={authStyles.userTypeCardInner}
      >
        <Text style={authStyles.userTypeCardIcon}>{icon}</Text>
        <Text style={[authStyles.userTypeCardTitle, active && authStyles.userTypeCardTitleActive]}>
          {title}
        </Text>
        <Text style={authStyles.userTypeCardDesc}>{description}</Text>
        {active ? (
          <View style={authStyles.userTypeCheckBadge}>
            <View style={authStyles.userTypeCheckBadgeCircle}>
              <Text style={authStyles.userTypeCheckBadgeText}>✓</Text>
            </View>
          </View>
        ) : null}
      </GlassSurface>
    </TouchableOpacity>
  );
}

export default UserTypeCard;

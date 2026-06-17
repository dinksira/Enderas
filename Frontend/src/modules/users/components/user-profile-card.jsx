import { useUserProfile } from '../hooks/use-user-profile.js';
import './user-profile-card.css';

export function UserProfileCard() {
  const { records, loading, error } = useUserProfile();

  return (
    <section className="user-profile-card" aria-live="polite">
      <h3 className="user-profile-card__title">User Profiles & KYC</h3>
      <p className="user-profile-card__body">
        Module-specific UI fragment scoped to the users domain.
      </p>
      <p className="user-profile-card__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default UserProfileCard;

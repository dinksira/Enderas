import { UserProfileCard } from '../components/user-profile-card.jsx';

export function UserProfileView() {
  return (
    <section className="users-view">
      <header>
        <h1 className="users-view__title">User Profiles & KYC</h1>
        <p className="users-view__lead">Bidder onboarding, identity profiles, and KYC compliance records.</p>
      </header>
      <UserProfileCard />
    </section>
  );
}

export default UserProfileView;

import HeroImage from '../assets/Images/option1.png';

export default function ImageSection() {
  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex items-end p-5"
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Text content */}
      <div className="relative text-white text-center w-full">
        <h2 className="text-3xl mb-4 text-bold">Join thousands of professionals and companies.</h2>
        <p>
          Whether you're looking for your next big opportunity or building your dream team, TalentMatch is here to help.
        </p>
      </div>
    </div>
  );
}

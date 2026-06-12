export default function ExpandableBio({ bio }: { bio: string }) {
  return (
    <p className="text-sm leading-6 text-fg/70 max-w-[65ch]">{bio}</p>
  );
}

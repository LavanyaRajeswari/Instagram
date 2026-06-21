import { Grid3X3, Bookmark, UserSquare2 } from "lucide-react";

function ProfileTabs({ activeTab, onTabChange }) {
  const tabClass = (tab) =>
    `flex items-center gap-2 py-4 border-t-2 -mt-[1px] ${
      activeTab === tab
        ? "border-black text-black"
        : "border-transparent text-[#8e8e8e]"
    }`;

  return (
    <div className="mt-[70px] flex justify-center gap-[88px] border-t border-[#dbdbdb] sm:gap-[162px]">
      <button type="button" onClick={() => onTabChange("posts")} className={tabClass("posts")}>
        <Grid3X3 size={24} strokeWidth={2.7} />
      </button>

      <button type="button" onClick={() => onTabChange("saved")} className={tabClass("saved")}>
        <Bookmark size={24} strokeWidth={2.2} />
      </button>

      <button type="button" onClick={() => onTabChange("tagged")} className={tabClass("tagged")}>
        <UserSquare2 size={24} strokeWidth={2.2} />
      </button>
    </div>
  );
}

export default ProfileTabs;
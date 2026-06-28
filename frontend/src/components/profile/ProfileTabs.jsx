import { Grid3X3, Bookmark, UserSquare2 } from "lucide-react";

function ProfileTabs({ activeTab, onTabChange, showSaved = true, showTagged = true }) {
  const tabClass = (tab) =>
    `flex items-center gap-2 py-4 border-t-2 -mt-[1px] transition-colors ${
      activeTab === tab
        ? "border-primary text-primary"
        : "border-transparent text-secondary hover:text-primary"
    }`;

  return (
    <div className="mt-[70px] flex justify-center gap-[88px] border-t border-primary sm:gap-[162px]">
      <button type="button" onClick={() => onTabChange("posts")} className={tabClass("posts")} aria-label="Posts">
        <Grid3X3 size={24} strokeWidth={2.7} />
      </button>

      {showSaved && (
        <button type="button" onClick={() => onTabChange("saved")} className={tabClass("saved")} aria-label="Saved posts">
          <Bookmark size={24} strokeWidth={2.2} />
        </button>
      )}

      {showTagged && (
        <button type="button" onClick={() => onTabChange("tagged")} className={tabClass("tagged")} aria-label="Tagged posts">
          <UserSquare2 size={24} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

export default ProfileTabs;

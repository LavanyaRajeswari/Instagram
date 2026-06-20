import { useState } from "react";
import Sidebar from "../components/Sidebar";
import CreatePostModal from "../components/CreatePostModal";

function PlaceholderPage({ title, description }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar onCreateClick={() => setCreateOpen(true)} />

      <main className="md:ml-[72px] xl:ml-[244px] flex min-h-screen items-center justify-center px-4 pb-[82px] pt-10 md:pb-10">
        <section className="w-full max-w-[420px] rounded-lg border border-[#dbdbdb] bg-white p-8 text-center">
          <h2 className="m-0 text-[22px] font-semibold text-[#262626]">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            {description}
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-6 rounded-lg bg-[#0095f6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#007ccf]"
          >
            Create post
          </button>
        </section>
      </main>

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

export default PlaceholderPage;

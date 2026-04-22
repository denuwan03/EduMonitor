import { useEffect, useState } from "react";
import api from "../services/api";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    name: "",
    skills: [],
    profile: { department: "", bio: "", phone: "" },
  });
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    api.get("/users/profile").then(({ data }) => {
      setProfile(data);
      setSkillsInput((data.skills || []).join(", "));
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: profile.name,
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      profile: profile.profile,
    };
    const { data } = await api.put("/users/profile", payload);
    setProfile(data);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Profile Management</h2>
      <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border p-4">
        <input
          className="rounded border p-2"
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <input
          className="rounded border p-2"
          placeholder="Skills: React, Node, MongoDB"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
        />
        <input
          className="rounded border p-2"
          placeholder="Department"
          value={profile.profile?.department || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              profile: { ...profile.profile, department: e.target.value },
            })
          }
        />
        <textarea
          className="rounded border p-2"
          placeholder="Bio"
          value={profile.profile?.bio || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              profile: { ...profile.profile, bio: e.target.value },
            })
          }
        />
        <input
          className="rounded border p-2"
          placeholder="Phone"
          value={profile.profile?.phone || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              profile: { ...profile.profile, phone: e.target.value },
            })
          }
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Save Profile</button>
      </form>
    </div>
  );
};

export default ProfilePage;

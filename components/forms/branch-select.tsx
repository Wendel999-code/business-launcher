"use client";
import { useApp } from "@/components/providers";
import { branches, locationName } from "@/data/dummy/branches";
export function BranchSelect({
  value,
  onChange,
  includeHQ = false,
}: {
  value: string;
  onChange: (v: string) => void;
  includeHQ?: boolean;
}) {
  const { profile } = useApp();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Location"
    >
      {profile.role === "admin" ? (
        <>
          {includeHQ && <option value="hq">Head Office</option>}
          {branches.map((b) => (
            <option value={b.id} key={b.id}>
              {b.name} Branch
            </option>
          ))}
        </>
      ) : (
        <option value={profile.branchId}>
          {locationName(profile.branchId)}
        </option>
      )}
    </select>
  );
}

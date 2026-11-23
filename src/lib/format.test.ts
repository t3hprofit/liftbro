import { describe, expect, it } from "vitest";
import { formatSeconds, formatSet, parseDuration } from "./format";

describe("durations", () => {
  it("formats seconds compactly", () => {
    expect(formatSeconds(45)).toBe("45s");
    expect(formatSeconds(60)).toBe("1:00");
    expect(formatSeconds(90)).toBe("1:30");
    expect(formatSeconds(3725)).toBe("1:02:05");
    expect(formatSeconds(-3)).toBe("0s");
  });

  it("parses the ways people type a time", () => {
    expect(parseDuration("45")).toBe(45);
    expect(parseDuration(" 1:30 ")).toBe(90);
    expect(parseDuration("1:02:05")).toBe(3725);
    expect(parseDuration("2m")).toBe(120);
    expect(parseDuration("1m30")).toBe(90);
    expect(parseDuration("1min 30s")).toBe(90);
    expect(parseDuration("30s")).toBe(30);
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("1:99")).toBeNull();
  });

  it("formats a set by how it was logged", () => {
    expect(formatSet({ weight: 135, reps: 8 })).toBe("135×8");
    expect(formatSet({ weight: 0, reps: 0, seconds: 75 })).toBe("1:15");
  });
});

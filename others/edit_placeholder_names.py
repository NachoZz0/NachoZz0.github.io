from __future__ import annotations

import json
import shutil
import sys
from collections import OrderedDict
from datetime import datetime
from pathlib import Path
from tkinter import BooleanVar, Canvas, StringVar, Tk, filedialog, messagebox, simpledialog
from tkinter import ttk


DEFAULT_FILE = Path(__file__).with_name("\u539f\u59cb\u6587\u4ef6.yaml")

PRESET_FIRST_NAME = "NachoZz"
PRESET_FIFTH_NAME = "[vmess]\u5b98\u7f51:https://nachozz.netlify,app"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")


def yaml_single_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def find_proxy_names(content: str) -> list[str]:
    names: list[str] = []
    seen: set[str] = set()
    in_proxies = False

    for raw_line in content.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not in_proxies:
            if stripped == "proxies:":
                in_proxies = True
            continue

        if not line.startswith("    - "):
            break

        marker = "name: '"
        start = line.find(marker)
        if start < 0:
            continue

        index = start + len(marker)
        chars: list[str] = []

        while index < len(line):
            char = line[index]
            if char == "'":
                if index + 1 < len(line) and line[index + 1] == "'":
                    chars.append("'")
                    index += 2
                    continue
                break
            chars.append(char)
            index += 1

        name = "".join(chars)
        if name and name not in seen:
            seen.add(name)
            names.append(name)

    return names


def remove_proxy_lines(content: str, names_to_delete: set[str]) -> tuple[str, int]:
    if not names_to_delete:
        return content, 0

    removed = 0
    result_lines: list[str] = []
    in_proxies = False

    for raw_line in content.splitlines():
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        if not in_proxies:
            if stripped == "proxies:":
                in_proxies = True
            result_lines.append(line)
            continue

        if not line.startswith("    - "):
            in_proxies = False
            result_lines.append(line)
            continue

        matched_name = None
        marker = "name: '"
        start = line.find(marker)
        if start >= 0:
            index = start + len(marker)
            chars: list[str] = []
            while index < len(line):
                char = line[index]
                if char == "'":
                    if index + 1 < len(line) and line[index + 1] == "'":
                        chars.append("'")
                        index += 2
                        continue
                    break
                chars.append(char)
                index += 1
            matched_name = "".join(chars)

        if matched_name in names_to_delete:
            removed += 1
            continue

        result_lines.append(line)

    return "\n".join(result_lines) + ("\n" if content.endswith("\n") else ""), removed


def remove_name_from_inline_lists(content: str, old_name: str) -> tuple[str, int]:
    old_token = yaml_single_quote(old_name)
    replacements = [
        (f", {old_token}", ""),
        (f"{old_token}, ", ""),
        (f"[{old_token}]", "[]"),
    ]

    changed = 0
    updated = content
    for source, target in replacements:
        count = updated.count(source)
        if count:
            updated = updated.replace(source, target)
            changed += count
    return updated, changed


def apply_changes(
    path: Path,
    rename_map: OrderedDict[str, str],
    delete_names: set[str],
) -> tuple[int, Path | None]:
    if not rename_map and not delete_names:
        return 0, None

    content = read_text(path)
    updated = content
    changed_count = 0

    updated, removed_lines = remove_proxy_lines(updated, delete_names)
    changed_count += removed_lines

    for old_name in delete_names:
        updated, removed_refs = remove_name_from_inline_lists(updated, old_name)
        changed_count += removed_refs

    for old_name, new_name in rename_map.items():
        old_token = yaml_single_quote(old_name)
        new_token = yaml_single_quote(new_name)
        occurrences = updated.count(old_token)
        if occurrences:
            updated = updated.replace(old_token, new_token)
            changed_count += occurrences

    backup_path = path.with_name(f"{path.name}.{datetime.now():%Y%m%d-%H%M%S}.bak")
    shutil.copy2(path, backup_path)
    write_text(path, updated)
    return changed_count, backup_path


def build_changes(
    proxy_names: list[str],
    value_vars: dict[str, StringVar],
    delete_vars: dict[str, BooleanVar],
) -> tuple[OrderedDict[str, str], set[str]]:
    rename_map: OrderedDict[str, str] = OrderedDict()
    delete_names: set[str] = set()
    used_new_names: set[str] = set()

    for old_name in proxy_names:
        if delete_vars[old_name].get():
            delete_names.add(old_name)
            continue

        new_name = value_vars[old_name].get().strip()
        if not new_name or new_name == old_name:
            continue
        if new_name in used_new_names:
            raise ValueError(f"新名字重复: {new_name}")
        used_new_names.add(new_name)
        rename_map[old_name] = new_name

    overlap = delete_names.intersection(rename_map.keys())
    if overlap:
        raise ValueError("同一行不能同时重命名和删除")

    return rename_map, delete_names


def parse_pairs_arg(text: str) -> OrderedDict[str, str]:
    mapping: OrderedDict[str, str] = OrderedDict()
    for part in text.split(";"):
        item = part.strip()
        if not item:
            continue
        if "=" not in item:
            raise ValueError(f"无效参数: {item}")
        key, value = item.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            raise ValueError(f"无效参数: {item}")
        mapping[key] = value
    return mapping


def parse_json_arg(text: str) -> OrderedDict[str, str]:
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("replace-json 必须是 JSON 对象")
    mapping: OrderedDict[str, str] = OrderedDict()
    for key, value in data.items():
        mapping[str(key)] = str(value)
    return mapping


def run_cli(path: Path, argv: list[str]) -> int:
    rename_map: OrderedDict[str, str] = OrderedDict()
    delete_names: set[str] = set()

    if "--replace-json" in argv:
        index = argv.index("--replace-json")
        rename_map = parse_json_arg(argv[index + 1])
    elif "--replace-pairs" in argv:
        index = argv.index("--replace-pairs")
        rename_map = parse_pairs_arg(argv[index + 1])

    if "--delete" in argv:
        index = argv.index("--delete")
        delete_names = {name.strip() for name in argv[index + 1].split(";") if name.strip()}

    changed_count, backup_path = apply_changes(path, rename_map, delete_names)
    print(f"changed={changed_count}")
    print(f"backup={backup_path or ''}")
    return 0


class ProxyNameEditor:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.root = Tk()
        self.root.title("YAML 节点名批量修改器")
        self.root.geometry("1100x760")
        self.root.minsize(980, 640)

        self.file_var = StringVar(value=f"当前文件: {self.path}")
        self.status_var = StringVar(value="状态: 就绪")
        self.value_vars: dict[str, StringVar] = {}
        self.delete_vars: dict[str, BooleanVar] = {}
        self.proxy_names: list[str] = []

        self._build_ui()
        self.reload_names()
        self.apply_preset()

    def _build_ui(self) -> None:
        main = ttk.Frame(self.root, padding=16)
        main.pack(fill="both", expand=True)

        ttk.Label(main, textvariable=self.file_var).pack(anchor="w")
        ttk.Label(
            main,
            text="左边是原节点名，中间填新名字，右边勾选删除。启动后会自动套用预设，保存时会同步修改引用并先备份。",
        ).pack(anchor="w", pady=(6, 12))

        top_bar = ttk.Frame(main)
        top_bar.pack(fill="x", pady=(0, 10))

        ttk.Button(top_bar, text="选择文件", command=self.choose_file).pack(side="left")
        ttk.Button(top_bar, text="重命名文件", command=self.rename_current_file).pack(side="left", padx=(8, 0))
        ttk.Button(top_bar, text="重新读取", command=self.reload_names).pack(side="left", padx=(8, 0))
        ttk.Button(top_bar, text="清空输入", command=self.clear_inputs).pack(side="left", padx=(8, 0))
        ttk.Button(top_bar, text="应用预设", command=self.apply_preset).pack(side="left", padx=(8, 0))

        table_wrap = ttk.Frame(main)
        table_wrap.pack(fill="both", expand=True)

        self.canvas = Canvas(table_wrap, highlightthickness=0)
        self.canvas.pack(side="left", fill="both", expand=True)

        scrollbar = ttk.Scrollbar(table_wrap, orient="vertical", command=self.canvas.yview)
        scrollbar.pack(side="right", fill="y")
        self.canvas.configure(yscrollcommand=scrollbar.set)

        self.rows_frame = ttk.Frame(self.canvas)
        self.rows_window = self.canvas.create_window((0, 0), window=self.rows_frame, anchor="nw")

        self.rows_frame.bind("<Configure>", self._on_frame_configure)
        self.canvas.bind("<Configure>", self._on_canvas_configure)
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)

        bottom_bar = ttk.Frame(main)
        bottom_bar.pack(fill="x", pady=(12, 0))

        ttk.Label(bottom_bar, textvariable=self.status_var).pack(side="left")
        ttk.Button(bottom_bar, text="保存修改", command=self.save).pack(side="right")

    def _on_frame_configure(self, _event) -> None:
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _on_canvas_configure(self, event) -> None:
        self.canvas.itemconfigure(self.rows_window, width=event.width)

    def _on_mousewheel(self, event) -> None:
        self.canvas.yview_scroll(int(-event.delta / 120), "units")

    def choose_file(self) -> None:
        selected = filedialog.askopenfilename(
            title="选择 YAML 文件",
            filetypes=[("YAML files", "*.yaml *.yml"), ("All files", "*.*")],
            initialdir=str(self.path.parent),
        )
        if not selected:
            return
        self.path = Path(selected)
        self.file_var.set(f"当前文件: {self.path}")
        self.reload_names()
        self.apply_preset()

    def rename_current_file(self) -> None:
        current_name = self.path.name
        new_name = simpledialog.askstring("重命名文件", "请输入新的文件名：", initialvalue=current_name, parent=self.root)
        if not new_name:
            return

        new_name = new_name.strip()
        if not new_name:
            return

        if not new_name.lower().endswith((".yaml", ".yml")):
            new_name += ".yaml"

        new_path = self.path.with_name(new_name)
        if new_path == self.path:
            self.status_var.set("状态: 文件名未变化")
            return

        if new_path.exists():
            overwrite = messagebox.askyesno("重命名文件", f"文件已存在，是否覆盖？\n{new_path}")
            if not overwrite:
                return
            new_path.unlink()

        self.path.rename(new_path)
        self.path = new_path
        self.file_var.set(f"当前文件: {self.path}")
        self.status_var.set(f"状态: 已重命名为 {self.path.name}")

    def clear_rows(self) -> None:
        for child in self.rows_frame.winfo_children():
            child.destroy()
        self.value_vars.clear()
        self.delete_vars.clear()

    def clear_inputs(self) -> None:
        for value_var in self.value_vars.values():
            value_var.set("")
        for delete_var in self.delete_vars.values():
            delete_var.set(False)
        self.status_var.set("状态: 已清空输入")

    def apply_preset(self) -> None:
        self.clear_inputs()
        if len(self.proxy_names) >= 1:
            self.value_vars[self.proxy_names[0]].set(PRESET_FIRST_NAME)
        if len(self.proxy_names) >= 2:
            self.delete_vars[self.proxy_names[1]].set(True)
        if len(self.proxy_names) >= 3:
            self.delete_vars[self.proxy_names[2]].set(True)
        if len(self.proxy_names) >= 5:
            self.value_vars[self.proxy_names[4]].set(PRESET_FIFTH_NAME)
        self.status_var.set("状态: 已自动应用预设")

    def reload_names(self) -> None:
        try:
            content = read_text(self.path)
        except Exception as exc:
            messagebox.showerror("YAML 节点名批量修改器", str(exc))
            self.status_var.set(f"状态: 读取失败 - {exc}")
            return

        self.proxy_names = find_proxy_names(content)
        self.clear_rows()

        if not self.proxy_names:
            self.status_var.set("状态: 没找到 proxies 节点名")
            ttk.Label(self.rows_frame, text="没有在 proxies: 段里找到可修改的 name 字段。").grid(
                row=0, column=0, sticky="w"
            )
            return

        ttk.Label(self.rows_frame, text="原节点名", width=50).grid(row=0, column=0, sticky="w", pady=(0, 8))
        ttk.Label(self.rows_frame, text="新节点名", width=50).grid(row=0, column=1, sticky="w", pady=(0, 8))
        ttk.Label(self.rows_frame, text="删除", width=8).grid(row=0, column=2, sticky="w", pady=(0, 8))

        for row_index, old_name in enumerate(self.proxy_names, start=1):
            value_var = StringVar()
            delete_var = BooleanVar(value=False)
            self.value_vars[old_name] = value_var
            self.delete_vars[old_name] = delete_var

            old_entry = ttk.Entry(self.rows_frame, width=58)
            old_entry.grid(row=row_index, column=0, sticky="ew", padx=(0, 12), pady=4)
            old_entry.insert(0, old_name)
            old_entry.state(["readonly"])

            new_entry = ttk.Entry(self.rows_frame, textvariable=value_var, width=58)
            new_entry.grid(row=row_index, column=1, sticky="ew", padx=(0, 12), pady=4)

            ttk.Checkbutton(self.rows_frame, variable=delete_var).grid(
                row=row_index, column=2, sticky="w", pady=4
            )

        self.rows_frame.columnconfigure(0, weight=1)
        self.rows_frame.columnconfigure(1, weight=1)
        self.status_var.set(f"状态: 共读取到 {len(self.proxy_names)} 个节点名")

    def save(self) -> None:
        try:
            rename_map, delete_names = build_changes(self.proxy_names, self.value_vars, self.delete_vars)
            if not rename_map and not delete_names:
                self.status_var.set("状态: 没有需要保存的修改")
                return

            changed_count, backup_path = apply_changes(self.path, rename_map, delete_names)
        except Exception as exc:
            messagebox.showerror("YAML 节点名批量修改器", str(exc))
            self.status_var.set(f"状态: 保存失败 - {exc}")
            return

        self.status_var.set(f"状态: 已保存，变更 {changed_count} 处")
        messagebox.showinfo(
            "YAML 节点名批量修改器",
            f"保存完成。\n变更处数: {changed_count}\n备份文件: {backup_path}",
        )
        self.reload_names()
        self.apply_preset()

    def run(self) -> None:
        self.root.mainloop()


def main(argv: list[str]) -> int:
    path = DEFAULT_FILE
    if "--file" in argv:
        index = argv.index("--file")
        path = Path(argv[index + 1])

    if "--replace-json" in argv or "--replace-pairs" in argv or "--delete" in argv:
        return run_cli(path, argv)

    editor = ProxyNameEditor(path)
    editor.run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

/**
 * ============================================================
 * 4_Frontend_Logic.js
 * OUTPUT: Integrasi API Apps Script & Manipulasi Form UI
 * ============================================================
 */

// TODO: MASUKKAN URL WEB APP ANDA DI SINI
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIkeTglGcowMwb9l7mQ6BZFpgk9r6CV2Z-m3rM5OaXAafwiF6t2181NrwZ0vpRrLq7Jg/exec";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("main-form");
  const actionInput = document.getElementById("input-action");
  const btnSubmit = document.getElementById("submit-btn");
  const identitasSection = document.getElementById("identitas-section");
  const nomorInput = document.getElementById("nomor_pemesanan");
  const alertBox = document.getElementById("alert-box");

  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");

  // LOGIKA AUTOCOMPLETE & VALIDASI DATABASE JSON
  const autocompleteList = document.getElementById("autocomplete-list");
  let validNumbers = [];
  let fullDataList = [];

  async function loadValidNumbers() {
    try {
      let dataPart1 = { data: [], kamus_upbjj: [] };
      let dataPart2 = { data: [], kamus_upbjj: [] };

      try {
        const res1 = await fetch("do_all_part1.json");
        if (res1.ok) {
          dataPart1 = await res1.json();
        } else {
          console.warn("Peringatan: File Part 1 gagal dimuat. Status:", res1.status);
        }
      } catch (e) {
        console.warn("Peringatan: File Part 1 gagal dimuat.", e);
      }

      try {
        const res2 = await fetch("do_all_part2.json");
        if (res2.ok) {
          dataPart2 = await res2.json();
        } else {
          console.warn("Peringatan: File Part 2 gagal dimuat. Status:", res2.status);
        }
      } catch (e) {
        console.warn("Peringatan: File Part 2 gagal dimuat.", e);
      }

      const data1Array = Array.isArray(dataPart1.data) ? dataPart1.data : [];
      const data2Array = Array.isArray(dataPart2.data) ? dataPart2.data : [];

      const kamusUpbjj =
        (Array.isArray(dataPart1.kamus_upbjj) && dataPart1.kamus_upbjj.length > 0
          ? dataPart1.kamus_upbjj
          : dataPart2.kamus_upbjj) || [];

      const combinedData = [...data1Array, ...data2Array];

      fullDataList = combinedData.map((row) => {
        const parts = String(row).split(";");
        return {
          nomor: parts[0] ? parts[0].trim() : "",
          nim: parts[1] ? parts[1].trim() : "Tidak ada NIM",
          upbjj:
            kamusUpbjj[parseInt(parts[2] ? parts[2].trim() : "0", 10)] ||
            "Tidak Diketahui",
        };
      });

      validNumbers = fullDataList.map((item) => item.nomor);
      console.log(`Database siap! Total nomor: ${validNumbers.length}`);
    } catch (error) {
      console.error("Gagal memproses database:", error);
    }
  }

  loadValidNumbers();

  nomorInput.addEventListener("input", function () {
    const val = this.value.trim();
    autocompleteList.innerHTML = "";
    autocompleteList.classList.add("hidden");

    if (!val) return;

    const filtered = validNumbers.filter((num) => num.includes(val)).slice(0, 5);

    if (filtered.length > 0) {
      autocompleteList.classList.remove("hidden");

      filtered.forEach((num) => {
        const div = document.createElement("div");
        const regex = new RegExp(`(${val})`, "gi");
        div.innerHTML = num.replace(regex, "<strong>$1</strong>");

        div.addEventListener("click", function () {
          nomorInput.value = num;
          autocompleteList.innerHTML = "";
          autocompleteList.classList.add("hidden");
        });

        autocompleteList.appendChild(div);
      });
    }
  });

  document.addEventListener("click", function (e) {
    if (e.target !== nomorInput) {
      autocompleteList.innerHTML = "";
      autocompleteList.classList.add("hidden");
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const originalBtnText = btnSubmit.textContent;
    btnSubmit.textContent = "Memproses, mohon tunggu...";
    btnSubmit.disabled = true;
    showAlert("", "hidden");

    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());

    const nomorDiketik = (dataObj.nomor_pemesanan || "").trim();

    if (nomorDiketik.length < 20 || nomorDiketik.length > 22) {
      showAlert("Nomor Pemesanan harus antara 20 hingga 22 digit.", "error");
      btnSubmit.textContent = originalBtnText;
      btnSubmit.disabled = false;
      return;
    }

    if (actionInput.value === "cek" && !validNumbers.includes(nomorDiketik)) {
      showAlert(
        "Nomor Pemesanan tidak terdaftar di database. Silakan periksa kembali.",
        "error"
      );
      btnSubmit.textContent = originalBtnText;
      btnSubmit.disabled = false;
      return;
    }

    if (actionInput.value === "simpan") {
      const nimDiketik = document.getElementById("nim").value.trim();
      const upbjjDiketik = document.getElementById("nama_upbjj").value.trim();
      const alasanReturDiketik = document.getElementById("alasan_retur").value.trim();

      if (
        nimDiketik === "" ||
        upbjjDiketik === "" ||
        alasanReturDiketik === ""
      ) {
        showAlert(
          "Alasan retur paket wajib diisi",
          "error"
        );
        btnSubmit.textContent = originalBtnText;
        btnSubmit.disabled = false;
        return;
      }
    }

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: new URLSearchParams(dataObj),
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let result;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error("Respons dari server bukan JSON.");
        }
      }

      handleResponse(result);
    } catch (error) {
      console.error("Fetch error:", error);
      showAlert(
        "Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.",
        "error"
      );
    } finally {
      btnSubmit.textContent = originalBtnText;
      btnSubmit.disabled = false;
    }
  });

  function handleResponse(res) {
    const actionState = actionInput.value;

    if (actionState === "cek") {
      if (res.status === "sudah_terdata") {
        showAlert(res.pesan, "error");
      } else if (res.status === "belum_terdata") {
        const matchedData = fullDataList.find(
          (d) => d.nomor === nomorInput.value.trim()
        );

        if (matchedData) {
          document.getElementById("nim").value = matchedData.nim;
          document.getElementById("nama_upbjj").value = matchedData.upbjj;
        }

        showAlert("Nomor ditemukan! Silakan lengkapi alasan retur.", "success");
        nomorInput.readOnly = true;
        identitasSection.classList.remove("hidden");

        step1.classList.remove("active");
        step2.classList.add("active");

        actionInput.value = "simpan";
        btnSubmit.textContent = "Simpan Data Retur";
      } else {
        showAlert(res.pesan || "Terjadi kesalahan.", "error");
      }
    } else if (actionState === "simpan") {
      if (res.status === "success") {
        showAlert("Berhasil! " + (res.pesan || "Data tersimpan."), "success");

        form.reset();
        identitasSection.classList.add("hidden");
        nomorInput.readOnly = false;

        step2.classList.remove("active");
        step1.classList.add("active");

        actionInput.value = "cek";
        btnSubmit.textContent = "Cek Nomor Pemesanan";
      } else {
        showAlert(res.pesan || "Gagal menyimpan data.", "error");
      }
    }
  }

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = "alert " + type;
  }
});

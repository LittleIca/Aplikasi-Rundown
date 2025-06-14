let data = [];
let lastEndTime = null;
let judulTampil = true;
let urutanEdit = null;
let aksiTampilIndex = null;

function tambahKegiatan() {
  const judul = document.getElementById("judulKegiatan").value;
  const tanggal = document.getElementById("tanggal").value;
  let jam = document.getElementById("jam").value;
  const durasi = parseInt(document.getElementById("durasi").value);
  const nama = document.getElementById("namaKegiatan").value;
  const pj = document.getElementById("penanggungJawab").value;

  if (!tanggal || !durasi || !nama || !pj || (!jam && !lastEndTime)) {
    alert("Lengkapi semua kolom yang dibutuhkan.");
    return;
  }

  if (!jam && lastEndTime) {
    jam = lastEndTime.toTimeString().substring(0, 5);
    document.getElementById("jam").value = jam;
  }

  const start = new Date(`${tanggal}T${jam}`);
  const end = new Date(start.getTime() + durasi * 60000);
  lastEndTime = end;

  const waktu = `${jam} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
  const urutanInput = urutanEdit !== null ? urutanEdit : (data.length > 0 ? Math.max(...data.map(d => d.urutanInput || 0)) + 1 : 1);

  data.push({ judul, tanggal, jam, durasi, nama, pj, waktu, start, end, urutanInput });

  if (judulTampil) judulTampil = false;

  data.sort((a, b) => a.urutanInput - b.urutanInput);
  render();

  urutanEdit = null;
  document.getElementById("namaKegiatan").value = "";
  document.getElementById("penanggungJawab").value = "";
  document.getElementById("durasi").value = "";
  document.getElementById("jam").value = "";
}

function isiJamOtomatis() {
  if (lastEndTime) {
    const jamInput = lastEndTime.toTimeString().substring(0, 5);
    document.getElementById("jam").value = jamInput;
  }
}

function formatDate(tgl) {
  const date = new Date(tgl);
  return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function nextDate(tgl) {
  const date = new Date(tgl);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

function render() {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";

  if (!judulTampil && data.length > 0) {
    const h2 = document.createElement("h2");
    h2.className = "judul-kegiatan";
    h2.textContent = document.getElementById("judulKegiatan").value;
    preview.appendChild(h2);
  }

  const grouped = {};
  data.forEach((item) => {
    const isOverMidnight = item.end.getDate() !== item.start.getDate();
    const groupDate = isOverMidnight ? nextDate(item.tanggal) : item.tanggal;
    if (!grouped[groupDate]) grouped[groupDate] = [];
    grouped[groupDate].push(item);
  });

  Object.keys(grouped).sort().forEach((tgl) => {
    const label = document.createElement("div");
    label.className = "tanggal-label";
    label.textContent = formatDate(tgl);
    preview.appendChild(label);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>No</th><th>Waktu</th><th>Nama Kegiatan</th><th>Penanggung Jawab</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    grouped[tgl].forEach((item, i) => {
      const index = data.indexOf(item);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${item.waktu}</td>
        <td class="nama-kegiatan-cell" style="cursor:pointer" data-index="${index}">${item.nama}</td>
        <td>${item.pj}</td>
      `;
      tbody.appendChild(tr);

      if (aksiTampilIndex === index) {
        const aksiRow = document.createElement("tr");
        aksiRow.innerHTML = `
          <td colspan="4" class="action-buttons">
            <button onclick="editItem(${index})">Edit</button>
            <button onclick="hapusItem(${index})">Hapus</button>
          </td>
        `;
        tbody.appendChild(aksiRow);
      }
    });

    table.appendChild(tbody);
    preview.appendChild(table);

    const footer = document.createElement("div");
    footer.className = "footer-note";
    footer.textContent = "By Zaenis";
    preview.appendChild(footer);
  });

  setTimeout(() => {
    document.querySelectorAll(".nama-kegiatan-cell").forEach(cell => {
      cell.addEventListener("click", () => {
        const index = parseInt(cell.getAttribute("data-index"));
        aksiTampilIndex = aksiTampilIndex === index ? null : index;
        render();
      });
    });
  }, 0);
}

function editItem(index) {
  const item = data[index];
  urutanEdit = item.urutanInput;
  document.getElementById("jam").value = "";
  document.getElementById("durasi").value = item.durasi;
  document.getElementById("namaKegiatan").value = item.nama;
  document.getElementById("penanggungJawab").value = item.pj;
  document.getElementById("tanggal").value = item.tanggal;
  document.getElementById("judulKegiatan").value = item.judul;
  data.splice(index, 1);
  aksiTampilIndex = null;
  render();
}

function hapusItem(index) {
  if (confirm("Yakin ingin menghapus kegiatan ini?")) {
    data.splice(index, 1);
    aksiTampilIndex = null;
    render();
  }
}

function cetakPDF() {
  html2canvas(document.getElementById("preview"), { scale: 2 }).then(canvas => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = 10;
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("rundown.pdf");
  });
}

function cetakGambar() {
  html2canvas(document.getElementById("preview"), { scale: 2 }).then(canvas => {
    const link = document.createElement("a");
    link.download = "rundown.png";
    link.href = canvas.toDataURL();
    link.click();
  });
}

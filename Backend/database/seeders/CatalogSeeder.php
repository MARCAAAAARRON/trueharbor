<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = collect(['Apparel', 'Accessories', 'Home', 'Outdoor'])
            ->mapWithKeys(fn(string $name) => [
                $name => Category::updateOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name],
                ),
            ]);

        // [category, name, price in cents, stock, (optional) is_active]
        $products = [
            ['Apparel', 'Harbor Crew Tee', 79900, 40],
            ['Apparel', 'Dockside Hoodie', 189900, 25],
            ['Apparel', 'Captains Cap', 59900, 60],
            ['Apparel', 'Windbreaker Jacket', 249900, 12],
            ['Apparel', 'Striped Sailor Shirt', 99900, 0],          // out of stock on purpose
            ['Accessories', 'Canvas Tote Bag', 59900, 35],
            ['Accessories', 'Leather Watch Strap', 129900, 18],
            ['Accessories', 'Brass Compass Keychain', 34900, 80],
            ['Accessories', 'Sailor Knot Bracelet', 44900, 50],
            ['Accessories', 'Polarized Sunglasses', 159900, 22],
            ['Home', 'Rope Handle Mug', 49900, 45],
            ['Home', 'Lighthouse Table Lamp', 219900, 10],
            ['Home', 'Woven Seagrass Basket', 89900, 30],
            ['Home', 'Ceramic Serving Bowl', 69900, 28],
            ['Home', 'Linen Throw Blanket', 149900, 15],
            ['Outdoor', 'Waterproof Dry Bag', 119900, 33],
            ['Outdoor', 'Insulated Steel Bottle', 89900, 70],
            ['Outdoor', 'Folding Camp Chair', 179900, 14],
            ['Outdoor', 'Packable Rain Poncho', 39900, 90],
            ['Outdoor', 'LED Camping Lantern', 99900, 24],
            ['Outdoor', 'Discontinued Deck Shoes', 129900, 5, false], // inactive on purpose
        ];

        foreach ($products as $row) {
            [$category, $name, $price, $stock] = $row;
            $slug = Str::slug($name);

            Product::updateOrCreate(
                ['slug' => $slug],
                [
                    'category_id' => $categories[$category]->id,
                    'name' => $name,
                    'description' => "{$name}: a sample product for the TrueHarbor demo store.",
                    'price_cents' => $price,
                    'stock' => $stock,
                    'image_path' => null,
                    'is_active' => $row[4] ?? true,
                ],
            );
        }
    }
}
